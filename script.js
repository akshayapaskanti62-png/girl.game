(() => {
    'use strict';

    const $ = id => document.getElementById(id);
    const stage = $('stage'), cv = $('gameCanvas'), ctx = cv.getContext('2d');
    const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
    const PLAYERS = [['👧', 'Lily'], ['🧒', 'Max'], ['🐰', 'Bunny'], ['🦊', 'Fox']];

    const LV = [
        { n: 'Sunny Meadow', img: 'back.jpg', goal: 150, song: 0 },
        { n: 'Golden Sunset', img: 'bg2.jpg', goal: 200, song: 1 },
        { n: 'Autumn Breeze', img: 'bg3.jpg', goal: 260, song: 2 },
        { n: 'Starry Night', img: 'bg4.jpg', goal: 320, song: 3 },
        { n: 'Rainy Day', img: 'bg5.jpg', goal: 380, song: 0 },
        { n: 'Cherry Blossom', img: 'bg6.jpg', goal: 440, song: 1 },
        { n: 'Snowy Winter', img: 'bg7.jpg', goal: 500, song: 2 },
        { n: 'Magic Twilight', img: 'bg8.jpg', goal: 560, song: 3 }
    ];

    const TIME = 50, BEAT = .4;

    const SONGS = [
        [
            [['Twin-', 0], ['kle', 0], ['twin-', 7], ['kle', 7], ['lit-', 9], ['tle', 9], ['star', 7, 2]],
            [['How', 5], ['I', 5], ['won-', 4], ['der', 4], ['what', 2], ['you', 2], ['are', 0, 2]],
            [['Up', 7], ['a-', 7], ['bove', 5], ['the', 5], ['world', 4], ['so', 4], ['high', 2, 2]],
            [['Like', 7], ['a', 7], ['dia-', 5], ['mond', 5], ['in', 4], ['the', 4], ['sky', 2, 2]]
        ],
        [
            [['Ma-', 4], ['ry', 2], ['had', 0], ['a', 2], ['lit-', 4], ['tle', 4], ['lamb', 4, 2]],
            [['lit-', 2], ['tle', 2], ['lamb', 2, 2], ['lit-', 4], ['tle', 7], ['lamb', 7, 2]],
            [['Ma-', 4], ['ry', 2], ['had', 0], ['a', 2], ['lit-', 4], ['tle', 4], ['lamb', 4], ['its', 4]],
            [['fleece', 2], ['was', 2], ['white', 4], ['as', 2], ['snow', 0, 2]]
        ],
        [
            [['Row', 0], ['row', 0], ['row', 0], ['your', 2], ['boat', 4, 2]],
            [['Gent-', 4], ['ly', 2], ['down', 4], ['the', 5], ['stream', 7, 2]],
            [['Mer-', 12], ['ri-', 12], ['ly', 12], ['mer-', 7], ['ri-', 7], ['ly', 7], ['mer-', 4], ['ri-', 4], ['ly', 4], ['mer-', 0], ['ri-', 0], ['ly', 0]],
            [['Life', 7], ['is', 5], ['but', 4], ['a', 2], ['dream', 0, 2]]
        ],
        [
            [['Old', 0], ['Mac-', 0], ['don-', 0], ['ald', 7], ['had', 9], ['a', 9], ['farm', 7, 2]],
            [['E', 4], ['I', 4], ['E', 2], ['I', 2], ['O', 0, 2]]
        ]
    ].map(L => ({ L }));

    const SONG_NAMES = [
        'Twinkle Twinkle Little Star',
        'Mary Had a Little Lamb',
        'Row, Row, Row Your Boat',
        'Old MacDonald'
    ];

    const layers = LV.map(l => {
        const d = document.createElement('div');
        d.className = 'bgl';
        d.style.backgroundImage = 'url(assets/' + l.img + ')';
        $('bgs').appendChild(d);
        return d;
    });

    $('logo').innerHTML = ['Flower', 'Catch'].map(w =>
        '<div>' + [...w].map((c, i) =>
            '<b style="color:' + ['#ff5d8f', '#ff9f1c', '#ffd23f', '#4cc764', '#3fa7f5', '#9b6bff'][i % 6] + '">' + c + '</b>'
        ).join('') + '</div>'
    ).join('');

    const CH = [
        { skin: '#ffd9b8', top: '#ff7a45', leg: '#ffd9b8', k: 'girl' },
        { skin: '#f5c9a0', top: '#3f88e6', leg: '#35507a', k: 'boy' },
        { skin: '#fff', top: '#ff8fc1', leg: '#fff', k: 'bunny' },
        { skin: '#ff9b3d', top: '#4caf6a', leg: '#ff9b3d', k: 'fox' }
    ];

    const FLOWERS = ['🌸', '🌼', '🌷', '🌺', '🌻'];

    const store = {
        get(k, d) {
            try {
                const v = localStorage.getItem(k);
                return v === null ? d : +v;
            }
            catch (e) {
                return d;
            }
        },

        set(k, v) {
            try {
                localStorage.setItem(k, v);
            }
            catch (e) { }
        }
    };

    let prog = {
        stars: Array(8).fill(0),
        best: Array(8).fill(0)
    };

    try {
        prog = JSON.parse(localStorage.getItem('flowerCatchProgress')) || prog;
    }
    catch (e) { }

    const saveProg = () => {
        try {
            localStorage.setItem('flowerCatchProgress', JSON.stringify(prog));
        }
        catch (e) { }
    };

    const S = {
        state: 'ready',
        score: 0,
        lives: 3,
        level: 1,
        streak: 0,
        items: [],
        pops: [],
        parts: [],
        lv: 0,
        time: 50,
        flat: [],
        ni: 0,
        px: 0,
        target: 0,
        keys: {},
        spawn: 0,
        musicOn: true,
        soundOn: true,
        player: store.get('petalPlayer', 0),
        squash: 0,
        flash: 0,
        t: 0
    };

    let W, H, DPR, pw, minX, maxX;

    let ac;

    function initAudio() {
        try {
            if (!ac)
                ac = new (window.AudioContext || window.webkitAudioContext)();

            if (ac.state !== 'running')
                ac.resume();
        }
        catch (e) { }
    }

    ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(ev =>
        window.addEventListener(ev, initAudio, { passive: true })
    );

    function tone(f, d, type, vol, when) {
        if (!ac || ac.state !== 'running')
            return;

        const t = when || ac.currentTime, o = ac.createOscillator(), g = ac.createGain();

        o.type = type;
        o.frequency.value = f;

        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);

        o.connect(g);
        g.connect(ac.destination);
        o.start(t);
        o.stop(t + d + 0.05);
    }

    const seq = (fs, d, type, vol, gap) =>
        fs.forEach((f, i) => tone(f, d, type, vol, ac && ac.currentTime + i * gap));

    const SFX = {
        catch: () => {
            const k = Math.min(S.streak, 12);
            tone(660 + k * 45, .14, 'sine', .3);
            tone(990 + k * 60, .18, 'sine', .2, ac && ac.currentTime + .06);
        },

        gold: () => seq([784, 988, 1175, 1568], .2, 'triangle', .3, .07),

        heart: () => seq([523, 659, 784], .25, 'sine', .3, .1),

        hit: () => {
            tone(220, .3, 'sawtooth', .22);
            tone(150, .35, 'square', .15, ac && ac.currentTime + .08);
        },

        level: () => seq([523, 659, 784, 1047, 1319], .25, 'triangle', .3, .1),

        over: () => seq([392, 330, 262, 196], .35, 'triangle', .3, .22),

        start: () => seq([523, 784], .2, 'triangle', .25, .1)
    };

    const play = k => {
        if (S.soundOn)
            SFX[k]();
    };

    let capLine = -1, nt = 0;
    const poemEl = $('poem');

    function caption(n) {
        if (S.state !== 'playing')
            return;

        if (n.li !== capLine) {
            capLine = n.li;
            poemEl.innerHTML = SONGS[LV[S.lv].song].L[n.li].map(x =>
                '<span class="' + (x[0].endsWith('-') ? 'j' : '') + '">' +
                x[0].replace(/-$/, '') +
                '</span>'
            ).join('');
        }

        [...poemEl.children].forEach((c, i) => {
            c.classList.toggle('on', i === n.k);
            c.classList.toggle('done', i < n.k);
        });
    }

    setInterval(() => {
        if (!ac || ac.state !== 'running')
            return;

        const now = ac.currentTime;

        if (nt < now)
            nt = now + .05;

        if (S.state !== 'playing') {
            nt = now + .05;
            return;
        }

        while (nt < now + .3) {
            const n = S.flat[S.ni % S.flat.length], when = nt;

            if (S.musicOn) {
                tone(523.25 * 2 ** (n.f / 12), n.b * BEAT * .95, 'triangle', .2, when);

                if (S.ni % 4 === 0)
                    tone(130.8, BEAT * 3, 'sine', .18, when);
            }

            setTimeout(() => caption(n), Math.max(0, (when - now) * 1000));

            nt += n.b * BEAT;
            S.ni++;
        }
    }, 100);

    function resize() {
        const vw = innerWidth, vh = innerHeight;

        W = Math.min(vw, vh * 16 / 9);
        H = W * 9 / 16;

        Object.assign(stage.style, {
            width: W + 'px',
            height: H + 'px',
            fontSize: W / 100 + 'px'
        });

        DPR = Math.min(2, devicePixelRatio || 1);

        cv.width = W * DPR;
        cv.height = H * DPR;

        pw = Math.max(80, W * .1);
        minX = W * .2 + pw / 2;
        maxX = W * .97 - pw / 2;

        S.px = clamp(S.px || W / 2, minX, maxX);
        S.target = S.px;
    }

    function drawPlayer() {
        const u = pw / 100, c = CH[S.player], sq = S.squash;

        const E = (x, y, rx, ry, col) => {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, 0, 0, 7);
            ctx.fill();
        };

        ctx.save();
        ctx.translate(S.px, H * .95);
        ctx.scale(u * (1 + sq * .1), u * (1 - sq * .08));

        const sw = Math.sin(S.t * 14) * (Math.abs(S.target - S.px) > 4 ? 5 : 0);

        if (c.k === 'fox') {
            E(38, -50, 24, 11, c.skin);
            E(54, -53, 9, 7, '#fff');
        }

        if (c.k === 'bunny') {
            E(-12, -168, 8, 27, c.skin);
            E(12, -168, 8, 27, c.skin);
            E(-12, -168, 4, 19, '#ffb3c9');
            E(12, -168, 4, 19, '#ffb3c9');
        }

        if (c.k === 'fox') {
            E(-17, -148, 9, 14, c.skin);
            E(17, -148, 9, 14, c.skin);
        }

        ctx.fillStyle = c.leg;
        ctx.fillRect(-14, -40, 10, 36 + sw);
        ctx.fillRect(4, -40, 10, 36 - sw);

        E(-9, -3 + sw, 14, 6, '#7a4a1d');
        E(9, -3 - sw, 14, 6, '#7a4a1d');

        ctx.fillStyle = c.top;
        ctx.beginPath();
        ctx.moveTo(-20, -98);
        ctx.lineTo(20, -98);
        ctx.lineTo(c.k === 'girl' ? 32 : 23, -38);
        ctx.lineTo(c.k === 'girl' ? -32 : -23, -38);
        ctx.fill();

        if (c.k === 'girl') {
            E(-28, -114, 8, 15, '#6b3f23');
            E(28, -114, 8, 15, '#6b3f23');
        }

        E(0, -122, 25, 23, c.skin);

        if (c.k === 'girl')
            E(0, -134, 26, 13, '#6b3f23');

        if (c.k === 'boy') {
            E(0, -137, 26, 11, '#e04a4a');
            ctx.fillStyle = '#e04a4a';
            ctx.fillRect(0, -140, 32, 7);
        }

        E(-8, -122, 3, 4, '#222');
        E(8, -122, 3, 4, '#222');
        E(-15, -114, 5, 3, 'rgba(255,110,110,.5)');
        E(15, -114, 5, 3, 'rgba(255,110,110,.5)');

        if (c.k === 'bunny' || c.k === 'fox')
            E(0, -115, 3.5, 2.5, '#d65a7a');

        ctx.strokeStyle = '#b4503c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -114, 6, .2, Math.PI - .2);
        ctx.stroke();

        ctx.strokeStyle = c.skin;
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-20, -92);
        ctx.lineTo(-42, -66);
        ctx.moveTo(20, -92);
        ctx.lineTo(42, -66);
        ctx.stroke();

        ctx.fillStyle = '#b8793a';
        ctx.strokeStyle = '#6b3f23';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-48, -60);
        ctx.lineTo(48, -60);
        ctx.lineTo(36, -28);
        ctx.lineTo(-36, -28);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        E(0, -60, 48, 7, '#d9a05b');
        ctx.beginPath();
        ctx.ellipse(0, -60, 48, 7, 0, 0, 7);
        ctx.stroke();

        ctx.restore();
    }

    function render() {
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.clearRect(0, 0, W, H);

        drawPlayer();
        ctx.textAlign = 'center';

        for (const it of S.items) {
            ctx.globalAlpha = it.sink === undefined ? 1 : 1 - it.sink / .25;
            ctx.font = it.r * 2.3 + 'px serif';
            ctx.shadowColor = it.bad ? 'rgba(255,50,50,.95)' : 'rgba(255,255,255,.9)';
            ctx.shadowBlur = it.r * .7;
            ctx.fillText(it.e, it.x + it.dx, it.y + it.r * .8);
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        for (const p of S.parts) {
            ctx.fillStyle = p.c;
            ctx.globalAlpha = 1 - p.t / .6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, W * .004, 0, 7);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.font = '700 ' + W * .022 + 'px Fredoka, sans-serif';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#7a4a1d';
        ctx.fillStyle = '#fff';

        for (const p of S.pops) {
            ctx.globalAlpha = 1 - p.t / .9;
            ctx.strokeText(p.txt, p.x, p.y);
            ctx.fillText(p.txt, p.x, p.y);
        }

        ctx.globalAlpha = 1;

        if (S.streak >= 5 && S.state === 'playing') {
            ctx.font = '700 ' + W * .026 + 'px Fredoka, sans-serif';
            ctx.fillStyle = '#ffe14d';

            const t = 'Combo x' + Math.min(3, 1 + (S.streak / 5 | 0));

            ctx.strokeText(t, W * .55, H * .08);
            ctx.fillText(t, W * .55, H * .08);
        }

        if (S.state === 'playing') {
            const g = LV[S.lv].goal, bw = W * .22, bx = W * .55 - bw / 2;

            ctx.fillStyle = 'rgba(60,35,10,.55)';
            ctx.fillRect(bx, H * .02, bw, H * .02);

            ctx.fillStyle = S.score >= g ? '#7be06a' : '#ffd23f';
            ctx.fillRect(bx, H * .02, bw * clamp(S.score / g, 0, 1), H * .02);

            ctx.font = '700 ' + W * .0125 + 'px Fredoka, sans-serif';
            ctx.fillStyle = '#fff';
            ctx.lineWidth = 3;

            const t = 'Goal ' + S.score + ' / ' + g + '   ⏱ ' + Math.ceil(S.time) + 's';

            ctx.strokeText(t, W * .55, H * .066);
            ctx.fillText(t, W * .55, H * .066);
        }

        if (S.flash > 0) {
            ctx.fillStyle = 'rgba(255,40,40,' + S.flash * .35 + ')';
            ctx.fillRect(0, 0, W, H);
        }
    }

    const lvl = () => LV[S.lv];
    const unlocked = i => i === 0 || prog.stars[i - 1] > 0;

    const hud = () => {
        $('score').textContent = S.score;
        $('bestScore').textContent = prog.best[S.lv] || 0;
        $('level').textContent = S.lv + 1;
        $('lives').textContent = '❤️'.repeat(S.lives) + '🖤'.repeat(3 - S.lives);
    };

    let toastT;

    function toast(t) {
        const el = $('toast');
        el.textContent = t;
        el.classList.add('show');
        clearTimeout(toastT);
        toastT = setTimeout(() => el.classList.remove('show'), 1800);
    }

    const show = (id, on) => $(id).classList.toggle('hidden', !on);
    const pop = (txt, x) => S.pops.push({ x, y: H * .95 - pw * .6, t: 0, txt });
    const setBg = () => layers.forEach((l, i) => l.classList.toggle('on', i === S.lv));

    function start(i) {
        initAudio();

        const flat = [];

        SONGS[LV[i].song].L.forEach((ln, li) =>
            ln.forEach((n, k) => flat.push({ f: n[1], b: n[2] || 1, li, k }))
        );

        Object.assign(S, {
            lv: i,
            score: 0,
            lives: 3,
            streak: 0,
            items: [],
            pops: [],
            parts: [],
            spawn: .5,
            squash: 0,
            flash: 0,
            time: TIME,
            flat,
            ni: 0,
            goalDone: false,
            state: 'playing'
        });

        S.px = S.target = W * .58;
        capLine = -1;
        poemEl.innerHTML = '';

        setBg();
        hud();

        ['start', 'map', 'pause', 'win', 'lose'].forEach(x => show(x, false));
        show('poem', true);

        toast('Level ' + (i + 1) + ' · ' + LV[i].n);
        play('start');
    }

    function pause(on) {
        if (on && S.state === 'playing') {
            S.state = 'paused';
            show('pause', true);
        }
        else if (!on && S.state === 'paused') {
            S.state = 'playing';
            show('pause', false);
            last = performance.now();
        }
    }

    function openMap() {
        S.state = 'menu';

        ['start', 'pause', 'win', 'lose', 'poem'].forEach(x => show(x, false));

        const box = $('levels');
        box.innerHTML = '';

        LV.forEach((L, i) => {
            const b = document.createElement('button'), ok = unlocked(i), st = prog.stars[i] || 0;

            b.className = 'lvl';
            b.disabled = !ok;
            b.style.backgroundImage = 'linear-gradient(rgba(0,0,0,.1),rgba(0,0,0,.65)),url(assets/' + L.img + ')';

            b.innerHTML = '<b>' + (ok ? i + 1 : '🔒') + '</b><span>' + L.n + '</span><i>' + (ok ? '★'.repeat(st) + '☆'.repeat(3 - st) : 'Locked') + '</i>';

            b.setAttribute('aria-label', 'Level ' + (i + 1) + ', ' + L.n + (ok ? ', ' + st + ' stars' : ', locked'));

            b.onclick = () => start(i);
            box.appendChild(b);
        });

        show('map', true);
    }

    function finish(won) {
        S.state = won ? 'won' : 'lost';
        show('poem', false);

        if (won) {
            const g = LV[S.lv].goal, st = S.score >= g * 1.8 ? 3 : S.score >= g * 1.4 ? 2 : 1;

            prog.stars[S.lv] = Math.max(prog.stars[S.lv] || 0, st);
            prog.best[S.lv] = Math.max(prog.best[S.lv] || 0, S.score);
            saveProg();

            $('winStars').textContent = '★'.repeat(st) + '☆'.repeat(3 - st);
            $('winScore').textContent = S.score;

            $('nextBtn').classList.toggle('hidden', S.lv >= LV.length - 1);

            play('level');
            show('win', true);
        }
        else {
            $('loseMsg').textContent = S.lives <= 0 ? 'Oh no, you ran out of lives!' : "Time's up! You needed " + LV[S.lv].goal + ' points.';

            play('over');
            show('lose', true);
        }

        hud();
    }

    function spawn() {
        const i = S.lv, r = W * .021, roll = Math.random(), g = Math.random();

        let o;

        if (roll < Math.min(.34, .14 + .025 * i))
            o = i > 0 && Math.random() < .4 ? { e: '🐝', bad: 1, v: 1.25, zig: 1 } : { e: '💧', bad: 1, v: 1 };
        else if (g < .06)
            o = { e: '⭐', k: 'gold', pts: 50, v: 1.2 };
        else if (g < .11 && S.lives < 3)
            o = { e: '💖', k: 'heart', v: 1 };
        else if (g < .15 && i > 1)
            o = { e: '⏰', k: 'clock', v: .9 };
        else if (g < .30)
            o = { e: '🦋', pts: 20, v: .8, zig: 1 };
        else
            o = { e: FLOWERS[Math.random() * 5 | 0], pts: 10, v: 1 };

        Object.assign(o, {
            x: minX + Math.random() * (maxX - minX),
            y: -r * 2,
            dx: 0,
            r,
            t: Math.random() * 6,
            vy: H * (.2 + .03 * (i + 1)) * o.v * (.9 + Math.random() * .2)
        });

        S.items.push(o);
    }

    function collect(it) {
        const x = it.x + it.dx;
        S.squash = 1;

        for (let i = 0; i < 12; i++) {
            S.parts.push({
                x,
                y: H * .95 - pw * .6,
                vx: (Math.random() - .5) * 320,
                vy: -Math.random() * 340,
                t: 0,
                c: it.bad ? '#6cc7ff' : ['#ffe14d', '#ff8fc1', '#fff'][i % 3]
            });
        }

        if (it.bad) {
            S.lives--;
            S.streak = 0;
            S.flash = 1;
            play('hit');
            pop('−1 life', x);
        }
        else if (it.k === 'heart') {
            S.lives++;
            play('heart');
            pop('+1 life', x);
        }
        else if (it.k === 'clock') {
            S.time += 5;
            play('heart');
            pop('+5 sec', x);
        }
        else {
            S.streak++;

            const m = Math.min(3, 1 + (S.streak / 5 | 0)), p = it.pts * m;

            S.score += p;
            play(it.k === 'gold' ? 'gold' : 'catch');
            pop('+' + p, x);

            if (!S.goalDone && S.score >= LV[S.lv].goal) {
                S.goalDone = true;
                toast('Goal reached! Keep going for more stars');
                play('level');
            }
        }

        hud();
    }

    function update(dt) {
        const k = S.keys, dir = (k.ArrowRight || k.d || k.D ? 1 : 0) - (k.ArrowLeft || k.a || k.A ? 1 : 0);

        if (dir)
            S.target = S.px + dir * W;

        S.px = clamp(S.px + clamp(S.target - S.px, -W * 1.1 * dt, W * 1.1 * dt), minX, maxX);

        if (dir)
            S.target = S.px;

        if ((S.spawn -= dt) <= 0) {
            spawn();
            S.spawn = Math.max(.4, .95 - S.lv * .07);
        }

        const u = pw / 100, rim = H * .95 - 58 * u;

        for (const it of S.items) {
            it.y += it.vy * dt * (it.sink === undefined ? 1 : .25);
            it.t += dt;

            if (it.sink !== undefined)
                it.sink += dt;

            it.dx = it.zig ? Math.sin(it.t * 3) * it.r * 2 : 0;

            if (it.sink === undefined && it.y + it.r > rim && it.y < rim + 22 * u && Math.abs(it.x + it.dx - S.px) < 46 * u + it.r * .3) {
                it.sink = 0;
                collect(it);
            }
        }

        S.items = S.items.filter(i => !(i.sink > .25) && i.y < H + 40);

        S.pops.forEach(p => {
            p.t += dt;
            p.y -= 60 * dt;
        });

        S.pops = S.pops.filter(p => p.t < .9);

        S.parts.forEach(p => {
            p.t += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 900 * dt;
        });

        S.parts = S.parts.filter(p => p.t < .6);

        S.squash = Math.max(0, S.squash - dt * 5);
        S.flash = Math.max(0, S.flash - dt * 3);

        if (S.lives <= 0)
            finish(false);
        else if ((S.time -= dt) <= 0)
            finish(S.score >= LV[S.lv].goal);
    }

    let last = performance.now();

    function loop(now) {
        const dt = Math.min(.05, (now - last) / 1000);

        last = now;
        S.t += dt;

        if (S.state === 'playing')
            update(dt);

        render();
        requestAnimationFrame(loop);
    }

    const picker = $('picker');

    PLAYERS.forEach(([e, n], i) => {
        const b = document.createElement('button');

        b.className = 'pick';
        b.setAttribute('role', 'radio');
        b.innerHTML = '<span>' + e + '</span>' + n;

        b.onclick = () => {
            S.player = i;
            store.set('petalPlayer', i);
            sync();
        };

        picker.appendChild(b);
    });

    const sync = () => [...picker.children].forEach((b, i) =>
        b.setAttribute('aria-checked', i === S.player)
    );

    sync();

    window.addEventListener('keydown', e => {
        if ([' ', 'ArrowLeft', 'ArrowRight'].includes(e.key) && S.state === 'playing')
            e.preventDefault();

        S.keys[e.key] = true;

        if (['p', 'P', 'Escape'].includes(e.key))
            pause(S.state === 'playing');
    });

    window.addEventListener('keyup', e => {
        S.keys[e.key] = false;
    });

    window.addEventListener('blur', () => {
        S.keys = {};
        pause(true);
    });

    document.addEventListener('visibilitychange', () => document.hidden && pause(true));

    const aim = e => {
        if (S.state === 'playing')
            S.target = e.clientX - cv.getBoundingClientRect().left;
    };

    cv.addEventListener('pointermove', aim);
    cv.addEventListener('pointerdown', aim);

    $('playBtn').onclick = () => {
        initAudio();
        openMap();
    };

    ['restartBtn', 'replayBtn', 'tryBtn'].forEach(id =>
        $(id).onclick = () => start(S.lv)
    );

    $('nextBtn').onclick = () => start(S.lv + 1);

    ['mapBtn1', 'mapBtn2', 'mapBtn3'].forEach(id =>
        $(id).onclick = openMap
    );

    $('backBtn').onclick = () => {
        show('map', false);
        show('start', true);
    };

    $('resumeBtn').onclick = () => pause(false);
    $('pauseBtn').onclick = () => pause(S.state === 'playing');

    const flip = (id, key) => $(id).onclick = e => {
        S[key] = !S[key];
        e.currentTarget.setAttribute('aria-pressed', S[key]);
        initAudio();

        if (S[key])
            key === 'soundOn' && SFX.catch();
    };

    flip('musicBtn', 'musicOn');
    flip('soundBtn', 'soundOn');

    window.addEventListener('resize', resize);

    window.PetalDrop = {
        S,
        audio: () => ac && ac.state
    };

    setBg();
    resize();
    hud();
    requestAnimationFrame(loop);
})();
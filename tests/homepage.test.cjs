const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const liveHtml = html.replace(/<!--[\s\S]*?-->/g, value => value.replace(/[^\n]/g, ' '));
const script = fs.readFileSync(path.join(root, 'js/script.js'), 'utf8');
const forms = fs.readFileSync(path.join(root, 'js/forms.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const linksHtml = fs.readFileSync(path.join(root, 'links/index.html'), 'utf8');
const linksCss = fs.readFileSync(path.join(root, 'links/links.css'), 'utf8');

test('HTML nesting, ids, anchors and local asset references are valid', () => {
    const stack = [];
    const voids = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
    for (const match of liveHtml.matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi)) {
        const tag = match[1].toLowerCase();
        if (voids.has(tag) || match[0].endsWith('/>')) continue;
        if (match[0].startsWith('</')) assert.equal(stack.pop(), tag, `Unbalanced ${match[0]}`);
        else stack.push(tag);
    }
    assert.deepEqual(stack, []);
    const ids = [...liveHtml.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length);
    for (const match of liveHtml.matchAll(/\bhref="#([^"]+)"/g)) assert.ok(ids.includes(match[1]));
    for (const match of liveHtml.matchAll(/\b(?:src|href)="([^"#]+)"/g)) {
        if (match[1].includes(':')) continue;
        assert.ok(fs.existsSync(path.join(root, match[1].split('?')[0])), match[1]);
    }
    assert.equal((liveHtml.match(/data-email-form/g) || []).length, 2);
    assert.equal((liveHtml.match(/name="_url"/g) || []).length, 2);
    assert.ok(!liveHtml.includes('Zoey Hernandez'));
    assert.ok(html.includes('Zoey Hernandez project on hold'));
    assert.ok(liveHtml.includes('class="skip-link" href="#main-content"'));
    assert.ok(liveHtml.includes('<main id="main-content">'));
});

test('styles have balanced scopes and no accidentally nested selectors', () => {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""');
    const scopes = [];
    let start = 0;
    for (let index = 0; index < clean.length; index++) {
        const char = clean[index];
        if (char === '{') {
            const selector = clean.slice(start, index).trim();
            assert.ok(scopes.every(scope => scope.startsWith('@')), `Unexpected nesting: ${selector}`);
            scopes.push(selector);
            start = index + 1;
        } else if (char === '}') {
            assert.ok(scopes.length, 'Unexpected closing brace');
            scopes.pop();
            start = index + 1;
        } else if (char === ';') start = index + 1;
    }
    assert.equal(scopes.length, 0);
    assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'));
    assert.ok(!/font-size:[^;]*!important/.test(css));
    assert.ok(css.includes('.project-preview .project-kicker'));
    assert.ok(css.includes('.project-preview .vst-interface-note'));
});

test('original hero and four approved VST pictures are byte-for-byte unchanged', () => {
    const expected = {
        'images/hero.jpg': '41567e73ead0c39e2bee49e448505874ed773b2966375b85ca291ce6e5629b1a',
        'images/vst-session/vst-session-edited-01.png': '03e3bcffe2d8632638056432f2ed1bdabdc896356004f6b9f46d113f952c7055',
        'images/vst-session/vst-session-edited-02.png': 'd7d09f471d00fd06e42a48b6251fa52ca81ca35a5a81f4ed1ddba36065d0374c',
        'images/vst-session/vst-session-edited-03.png': 'cfc60b3607cb6ca71075c841e6c04c67d0dd0ac462439a49e8a040f270e916bf',
        'images/vst-session/vst-session-edited-04.png': '976901c8fd791789f738f7a8074134998213b6602bf9411850e0ac7b5ca80f96'
    };
    for (const [file, hash] of Object.entries(expected)) {
        assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'), hash);
    }
});

test('optimized VST delivery copies preserve originals and reduce transfer size', () => {
    for (const number of ['01', '02', '03', '04']) {
        const original = path.join(root, `images/vst-session/vst-session-edited-${number}.png`);
        const delivery = path.join(root, `images/vst-session/vst-session-web-${number}.jpg`);
        assert.ok(fs.existsSync(delivery));
        assert.ok(fs.statSync(delivery).size < fs.statSync(original).size);
        assert.ok(liveHtml.includes(`src="images/vst-session/vst-session-web-${number}.jpg"`));
    }
    const vstGallery = liveHtml.split('<div class="slider vst-slider">')[1].split('<button class="prev"')[0];
    assert.equal((vstGallery.match(/loading="lazy"/g) || []).length, 4);
});

test('legacy blank routes now redirect to current homepage sections', () => {
    const redirects = new Map([
        ['about.html', 'index.html#about'],
        ['contact.html', 'index.html#contact'],
        ['education.html', 'index.html#education'],
        ['equipment.html', 'index.html#technical'],
        ['work.html', 'index.html#work'],
        ['projects/Dorsy.html', '../index.html#dorsy'],
        ['projects/paradiso.html', '../index.html#paradiso'],
        ['projects/suite-spot.html', '../index.html#suite-spot']
    ]);
    redirects.forEach((destination, file) => {
        const redirect = fs.readFileSync(path.join(root, file), 'utf8');
        assert.ok(redirect.includes(`content="0; url=${destination}"`), file);
        assert.ok(redirect.includes(`href="${destination}"`), file);
    });
    assert.ok(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8').includes('https://erikmagnifico.com/sitemap.xml'));
    const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
    assert.ok(sitemap.includes('<loc>https://erikmagnifico.com/</loc>'));
    assert.ok(sitemap.includes('<loc>https://erikmagnifico.com/links/</loc>'));
});

test('hero derivatives, lazy galleries and reversible sharing metadata are present', () => {
    for (const width of [800, 1200, 1600, 2400]) {
        const file = `images/hero-${width}.jpg`;
        assert.ok(liveHtml.includes(`${file} ${width}w`));
        assert.ok(fs.statSync(path.join(root, file)).size < 250000);
    }
    assert.match(liveHtml, /fetchpriority="high"/);
    const photos = [...liveHtml.matchAll(/<img[^>]*src="images\/(?:suitespot|paradiso|dorsy)[^>]*>/g)];
    assert.equal(photos.length, 24);
    photos.forEach(match => assert.ok(match[0].includes('loading="lazy"')));
    assert.ok(html.includes('End sharing/search metadata.'));
    assert.ok(html.includes('property="og:image" content="https://erikmagnifico.com/images/hero-1200.jpg"'));
    assert.ok(!script.includes('const contactForm ='));
    new vm.Script(script);
    new vm.Script(forms);
});

test('Dorsy has ten photos and one video; removed photo remains on disk', () => {
    const gallery = liveHtml.split('<div class="slider dorsy-slider">')[1].split('<button class="prev"')[0];
    assert.equal((gallery.match(/<img /g) || []).length, 10);
    assert.equal((gallery.match(/<video /g) || []).length, 1);
    assert.ok(!gallery.includes('images/dorsy-01.jpg'));
    assert.ok(gallery.includes('item 11 of 11'));
    assert.ok(gallery.includes('01 / 11'));
    assert.ok(!gallery.includes('of 12'));
    assert.ok(fs.existsSync(path.join(root, 'images/dorsy-01.jpg')));
});

test('/links has the four intended destinations and complete metadata', () => {
    const expected = [
        'href="../index.html"',
        'href="https://www.instagram.com/erik.magnifico/"',
        'href="https://www.instagram.com/suitespotconcert/"',
        'href="https://www.linkedin.com/in/erikmagnifico"'
    ];
    expected.forEach(link => assert.ok(linksHtml.includes(link), link));
    assert.ok(linksHtml.includes('href="https://erikmagnifico.com/links/"'));
    assert.ok(linksHtml.includes('property="og:image"'));
    assert.ok(linksHtml.includes('aria-label="Erik Magnifico’s links"'));
    assert.ok(linksCss.includes('min-height:100dvh'));
    assert.ok(linksCss.includes('@media (prefers-reduced-motion: reduce)'));
    assert.ok(linksHtml.includes('based in Amsterdam.'));
    assert.ok(linksHtml.includes('Projects, recordings and music software'));
    assert.ok(!linksHtml.includes('and the upright piano VST'));
    assert.ok(!linksHtml.includes('Amsterdam and Copenhagen'));
    assert.ok(linksCss.includes('.link-list::before'));
    assert.ok(linksCss.includes('clip-path:polygon(0 48px'));
    assert.match(linksCss, /\.links-page\s*\{[^}]*position:relative;/s);
    assert.match(linksCss, /\.links-logo\s*\{[^}]*position:absolute;[^}]*top:18px;[^}]*left:35px;/s);
    assert.ok(linksHtml.includes('class="links-profile"'));
    assert.ok(linksHtml.includes('class="links-actions"'));
    assert.ok(linksCss.includes('@media (min-width: 900px)'));
    assert.ok(linksCss.includes('grid-template-columns:minmax(300px, 0.95fr) minmax(360px, 1fr)'));
    assert.ok(linksCss.includes('flex-direction:column-reverse'));
    assert.ok(linksCss.includes('aspect-ratio:3 / 2'));
    assert.ok(linksCss.includes('transform:translateX(clamp(-82px, -4.2vw, -28px))'));
    assert.ok(linksCss.includes('transform:translateX(clamp(24px, 2.2vw, 38px))'));
    assert.ok(linksCss.includes('radial-gradient(circle at 35% 45%'));
    assert.ok(linksCss.includes('rgba(168,108,58,0.11)'));
    assert.ok(linksCss.includes('max-width:560px'));
    assert.ok(html.includes('aria-label="Erik Magnifico’s social links"'));
    assert.ok(html.includes('<strong>Suite Spot</strong>'));
    assert.ok(html.includes('<small>@suitespotconcert</small>'));
    assert.ok(css.includes('grid-template-columns:1fr'));
    assert.ok(css.includes('.contact-link-arrow'));
    assert.ok(css.includes('rgba(168,108,58,0.11)'));
    assert.ok(!html.includes('<strong>All links</strong>'));
    assert.ok(!liveHtml.includes('Amsterdam · Copenhagen'));
    assert.ok(!liveHtml.includes('Avid Pro Tools Certification'));
    assert.ok(!liveHtml.includes('Apple Digital Masters Workflow'));
    assert.ok(liveHtml.includes('From session setup to final mix.'));
    assert.ok(css.includes('font-size:clamp(46px, 5vw, 72px)'));
    assert.ok(liveHtml.includes('Recording &amp; Sampling'));
    assert.ok(liveHtml.includes('Editing &amp; Mixing'));
    assert.ok(liveHtml.includes('Software Workflow'));
    assert.ok(liveHtml.includes('multi-mic instrument sampling'));
    assert.ok(liveHtml.includes('Dolby Atmos music workflows'));
    assert.ok(!liveHtml.includes('multi-mic upright piano sampling'));
    assert.ok(!liveHtml.includes('class="technical-number"'));
    const technicalSection = liveHtml.split('<section id="technical" class="technical-preview neutral-section">')[1].split('</section>')[0];
    assert.ok(!technicalSection.includes('Neve VR Legend'));
    assert.ok(!technicalSection.includes('SSL 8000 G'));
    assert.ok(!technicalSection.includes('Studer Tape'));
    assert.ok(!liveHtml.includes('A musician’s ear behind the desk.'));
    assert.ok(liveHtml.includes('intimate live sessions'));
    assert.ok(css.includes('grid-template-columns:minmax(280px, 0.85fr) minmax(360px, 1fr)'));
    assert.ok(css.includes('.about-copy .about-lead {\n    grid-row:1 / span 2;\n    font-family:"Instrument Serif", serif;\n    font-size:24px;'));
    assert.ok(css.includes('.about-copy .about-lead {\n        font-size:22px;'));
    assert.ok(!liveHtml.includes('The technical choices should support the performance—not compete with it.'));
    assert.ok(!liveHtml.includes('class="about-closing"'));
    assert.ok(!liveHtml.includes('class="about-signals"'));
    assert.ok(liveHtml.includes('<h2 class="education-kicker">Education</h2>'));
    assert.ok(!liveHtml.includes('Education &amp; Training'));
    assert.ok(!liveHtml.includes('Current studies at Abbey Road Institute Amsterdam alongside completed Dolby Atmos training.'));
    assert.ok(liveHtml.includes('Dolby Atmos Mix Room Design and DARDT Training - Completion Certificate'));
    assert.ok(liveHtml.includes('Dolby Atmos Essentials Completion Certificate'));
    assert.ok(liveHtml.includes('MTZfMTYxNDJfTWVsMldpbiMyMDIyI0xpbmtkaW4'));
    assert.ok(liveHtml.includes('Ml8xNjE0Ml9NZWwyV2luIzIwMjIjTGlua2Rpbg'));
    assert.ok(!liveHtml.includes('<h3>\nAdditional Training'));
    assert.ok(!liveHtml.includes('Dolby Atmos certified engineer'));
    assert.ok(!liveHtml.includes('Hands-on study across recording, production, editing and mixing'));
    assert.ok(!liveHtml.includes('class="education-meta"'));
    const educationStyles = css.split('.education-preview {')[1].split('.technical-preview {')[0];
    assert.ok(!educationStyles.includes('border-top'));
    assert.ok(!educationStyles.includes('border-bottom'));
    assert.ok(educationStyles.includes('padding-top:clamp(48px, 5vw, 68px)'));
    assert.ok(educationStyles.includes('padding-bottom:clamp(52px, 5.5vw, 74px)'));
    assert.ok(educationStyles.includes('margin-top:26px'));
    assert.ok(!css.includes('.education-grid::before'));
    assert.ok(css.includes('.education-grid::after'));
    assert.ok(css.includes('bottom:-54px'));
    assert.ok(!educationStyles.includes('padding-top:clamp(36px, 3.5vw, 46px)'));
    assert.ok(!educationStyles.includes('padding-bottom:clamp(50px, 4.5vw, 62px)'));
    assert.ok(!css.includes('.education-preview::before'));
    assert.ok(!css.includes('.technical-preview::before'));
    assert.ok(css.includes('body > header {'));
    assert.ok(!/(?:^|\n)\s*header\s*\{/m.test(css));
    assert.ok(css.includes('.about-preview::after'));
    assert.ok(!css.includes('.about-kicker::before'));
    assert.ok(liveHtml.includes('<header class="about-heading">'));
    assert.ok(liveHtml.includes('<h2 class="about-kicker">About</h2>'));
    assert.ok(liveHtml.includes('<header class="education-heading">'));
    assert.ok(script.includes('["dorsy", "suite-spot", "vst", "paradiso"]'));
    assert.ok(liveHtml.includes('data-work-project="dorsy"'));
    assert.ok(liveHtml.includes('data-work-project="suite-spot"'));
});

function formHarness(fetchImpl, options = {}) {
    const email = { value: ' listener@example.com ', readOnly: false };
    const message = { value: ' A recording enquiry ', readOnly: false };
    const honey = { value: options.honey || '', readOnly: false };
    const fields = [email, message, honey];
    const button = { disabled: false, textContent: 'Send request' };
    const status = { textContent: '', dataset: {} };
    const fallback = { hidden: true };
    const attributes = {};
    const requests = [];
    let handler, timeoutCallback, resets = 0;
    const form = {
        dataset: { ajaxAction: 'https://formsubmit.co/ajax/contact@erikmagnifico.com', successMessage: 'Confirmed.' },
        elements: { namedItem: () => honey },
        querySelector: selector => ({ '[data-form-submit]': button, '[data-form-status]': status, '[data-form-fallback]': fallback })[selector],
        querySelectorAll: () => fields,
        addEventListener: (name, callback) => { handler = callback; },
        reportValidity: () => options.valid !== false,
        setAttribute: (name, value) => { attributes[name] = value; },
        removeAttribute: name => { delete attributes[name]; },
        reset: () => { resets++; fields.forEach(field => { field.value = ''; }); }
    };
    class MockFormData {
        *[Symbol.iterator]() {
            yield ['email', email.value];
            yield ['request', message.value];
            yield ['_honey', honey.value];
            yield ['_url', 'https://erikmagnifico.com/'];
        }
    }
    vm.runInNewContext(forms, {
        document: { querySelectorAll: () => [form] },
        window: { location: { protocol: options.protocol || 'https:' } },
        URLSearchParams, FormData: MockFormData, AbortController,
        setTimeout: callback => { timeoutCallback = callback; return 1; },
        clearTimeout: () => {},
        fetch: (url, config) => { requests.push({ url, config }); return fetchImpl(url, config); }
    });
    return {
        email, message, button, status, fallback, attributes, requests,
        get resets() { return resets; },
        timeout: () => timeoutCallback(),
        submit: async (native = false) => {
            let prevented = false;
            await handler({ preventDefault() { prevented = true; }, submitter: { hasAttribute: () => native } });
            return prevented;
        }
    };
}

for (const success of [true, 'true']) {
    test(`accepted form response ${JSON.stringify(success)} clears fields only on success`, async () => {
        const h = formHarness(async () => ({ ok: true, json: async () => ({ success }) }));
        await h.submit();
        assert.equal(h.status.dataset.state, 'success');
        assert.equal(h.resets, 1);
        assert.equal(h.requests[0].config.body.get('email'), 'listener@example.com');
        assert.equal(h.requests[0].config.body.get('_url'), 'https://erikmagnifico.com/');
        assert.equal(h.button.disabled, false);
        assert.equal(h.email.readOnly, false);
        assert.equal(h.fallback.hidden, true);
        assert.equal(h.attributes['aria-busy'], undefined);
    });
}

for (const [name, response] of [
    ['HTTP 500', { ok: false, json: async () => ({}) }],
    ['HTTP 200 with rejection', { ok: true, json: async () => ({ success: false, message: 'Rejected.' }) }],
    ['string rejection', { ok: true, json: async () => ({ success: 'false' }) }],
    ['missing confirmation', { ok: true, json: async () => ({}) }],
    ['non-JSON verification page', { ok: true, json: async () => { throw new Error('HTML response'); } }],
    ['rate limiting', { ok: false, status: 429, json: async () => ({}) }],
    ['activation needed', { ok: true, json: async () => ({ success: 'true', message: 'Please activate your form.' }) }],
    ['provider text is never inserted as HTML', { ok: true, json: async () => ({ success: false, message: '<script>bad()</script>' }) }]
]) {
    test(`${name} keeps entered details and offers an explicit native retry`, async () => {
        const h = formHarness(async () => response);
        await h.submit();
        assert.equal(h.status.dataset.state, 'error');
        assert.equal(h.resets, 0);
        assert.equal(h.email.value, 'listener@example.com');
        assert.equal(h.message.value, 'A recording enquiry');
        assert.equal(h.button.disabled, false);
        assert.equal(h.fallback.hidden, false);
        assert.equal(h.status.innerHTML, undefined);
    });
}

test('network error, timeout, validation, honeypot, local preview and native fallback', async () => {
    const offline = formHarness(async () => { throw new TypeError('Failed to fetch'); });
    await offline.submit();
    assert.match(offline.status.textContent, /couldn’t connect/);
    assert.equal(offline.resets, 0);
    const timeout = formHarness((url, config) => new Promise((resolve, reject) => {
        config.signal.addEventListener('abort', () => reject(Object.assign(new Error(), { name: 'AbortError' })));
    }));
    const pending = timeout.submit();
    timeout.timeout();
    await pending;
    assert.match(timeout.status.textContent, /timed out/);
    assert.equal(timeout.button.disabled, false);
    for (const options of [{ valid: false }, { honey: 'bot' }, { protocol: 'file:' }]) {
        const h = formHarness(() => assert.fail('Must not contact service'), options);
        await h.submit();
        assert.equal(h.requests.length, 0);
    }
    const native = formHarness(() => assert.fail('Native submit must not use fetch'));
    assert.equal(await native.submit(true), false);
    assert.equal(native.resets, 0);
});

test('pending submission locks controls and prevents duplicate requests', async () => {
    let finish;
    const h = formHarness(() => new Promise(resolve => { finish = resolve; }));
    const pending = h.submit();
    assert.equal(h.button.disabled, true);
    assert.equal(h.email.readOnly, true);
    assert.equal(h.attributes['aria-busy'], 'true');
    await h.submit();
    await h.submit(true);
    assert.equal(h.requests.length, 1);
    finish({ ok: true, json: async () => ({ success: true }) });
    await pending;
    assert.equal(h.button.disabled, false);
});

test('lightbox contains focus, navigates, closes and restores previous inert states', () => {
    const handlers = {};
    const document = { activeElement: null, addEventListener: (name, fn) => { handlers[name] = fn; } };
    class Element {
        constructor() { this.listeners = {}; this.children = []; this.attrs = {}; this.hidden = false; this.inert = false; }
        addEventListener(name, fn) { this.listeners[name] = fn; }
        setAttribute(name, value) { this.attrs[name] = value; }
        getAttribute(name) { return this.attrs[name]; }
        focus() { document.activeElement = this; handlers.focusin?.({ target: this }); }
        contains(element) { return element === this || this.children.some(child => child.contains(element)); }
        querySelector() { return null; }
        appendChild(element) { this.children.push(element); }
        replaceChildren() { this.children = []; }
        fire(name) { this.listeners[name]({ preventDefault() {}, target: this }); }
    }
    class Image extends Element { constructor() { super(); this.alt = 'Photo'; this.src = 'image.jpg'; } }
    class Video extends Element {}
    const dialog = new Element(); dialog.hidden = true;
    const close = new Element(), prev = new Element(), next = new Element(), stage = new Element(), counter = new Element();
    dialog.children = [close, prev, stage, next, counter];
    dialog.querySelector = selector => ({ '.media-lightbox-close': close, '.media-lightbox-prev': prev, '.media-lightbox-next': next, '.media-lightbox-stage': stage, '.media-lightbox-counter': counter })[selector];
    dialog.querySelectorAll = () => [close, prev, next];
    const backgrounds = [new Element(), new Element(), new Element()]; backgrounds[2].inert = true;
    const slides = [new Image(), new Image()];
    slides.forEach(slide => { slide.closest = () => ({ querySelectorAll: () => slides }); });
    backgrounds[1].children = slides;
    document.querySelector = () => dialog;
    document.querySelectorAll = selector => selector.startsWith('body >') ? backgrounds : slides;
    document.createElement = () => new Image();
    const bodyClasses = new Set();
    document.body = { classList: { add: value => bodyClasses.add(value), remove: value => bodyClasses.delete(value) } };
    const code = script.slice(script.indexOf('const mediaLightbox ='), script.indexOf('document.querySelectorAll(".custom-player")'));
    vm.runInNewContext(code, { document, HTMLImageElement: Image, HTMLVideoElement: Video });
    slides[0].fire('click');
    assert.equal(dialog.hidden, false);
    assert.equal(document.activeElement, close);
    assert.ok(backgrounds.every(element => element.inert));
    next.focus();
    handlers.keydown({ key: 'Tab', target: next, preventDefault() {} });
    assert.equal(document.activeElement, close);
    handlers.keydown({ key: 'Tab', shiftKey: true, target: close, preventDefault() {} });
    assert.equal(document.activeElement, next);
    backgrounds[0].focus();
    assert.equal(document.activeElement, close);
    next.fire('click');
    assert.equal(counter.textContent, '02 / 02');
    handlers.keydown({ key: 'ArrowRight', target: next, preventDefault() {} });
    assert.equal(counter.textContent, '01 / 02');
    handlers.keydown({ key: 'Escape', target: close, preventDefault() {} });
    assert.equal(dialog.hidden, true);
    assert.equal(document.activeElement, slides[0]);
    assert.deepEqual(backgrounds.map(element => element.inert), [false, false, true]);
    assert.equal(bodyClasses.size, 0);
    assert.equal(stage.children.length, 0);
});

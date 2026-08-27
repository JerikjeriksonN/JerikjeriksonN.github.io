// Shared form handling. No addresses or messages are saved in browser storage.
function setupEmailForm(form) {
    const submitButton = form.querySelector('[data-form-submit]');
    const status = form.querySelector('[data-form-status]');
    const fallback = form.querySelector('[data-form-fallback]');
    const fields = Array.from(form.querySelectorAll('input:not([type="hidden"]), textarea'));
    let submitting = false;

    function showError(message) {
        status.dataset.state = 'error';
        status.textContent = message;
        fallback.hidden = false;
    }

    form.addEventListener('submit', async event => {
        if (submitting) {
            event.preventDefault();
            return;
        }

        fields.forEach(field => { field.value = field.value.trim(); });
        if (!form.reportValidity() || form.elements.namedItem('_honey')?.value) {
            event.preventDefault();
            return;
        }

        // An explicit retry can use FormSubmit's normal, CAPTCHA-capable page.
        // Never automatically resend a request whose delivery is uncertain.
        if (event.submitter?.hasAttribute('data-native-submit')) return;
        event.preventDefault();

        if (window.location.protocol === 'file:') {
            showError('This is a local preview. Please use erikmagnifico.com to submit, or email contact@erikmagnifico.com.');
            return;
        }

        const values = new URLSearchParams(new FormData(form));
        const previousReadOnly = fields.map(field => field.readOnly);
        const originalButtonText = submitButton.textContent;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        submitting = true;
        submitButton.disabled = true;
        fields.forEach(field => { field.readOnly = true; });
        fallback.hidden = true;
        form.setAttribute('aria-busy', 'true');
        submitButton.textContent = 'Sending…';
        status.dataset.state = 'pending';
        status.textContent = 'Sending — please keep this page open.';

        try {
            // Form-encoded data avoids an unnecessary cross-origin JSON preflight.
            const response = await fetch(form.dataset.ajaxAction, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: values,
                signal: controller.signal
            });
            const result = await response.json().catch(() => null);
            const detail = typeof result?.message === 'string' ? result.message.slice(0, 350) : '';

            if (/activat|verif|confirm (?:your|the) (?:form|email)/i.test(detail)) {
                showError('This form is awaiting email verification by Erik. Please email contact@erikmagnifico.com directly for now.');
            } else if (response.status === 429) {
                showError('The form service is receiving too many requests. Please wait a little before trying again. Your details are still here.');
            } else if (!response.ok || (result?.success !== true && result?.success !== 'true')) {
                showError(detail
                    ? `The form service couldn’t confirm delivery: ${detail}`
                    : 'The service did not confirm delivery. Try the secure form below, or email contact@erikmagnifico.com.');
            } else {
                form.reset();
                status.dataset.state = 'success';
                status.textContent = form.dataset.successMessage;
            }
        } catch (error) {
            showError(error.name === 'AbortError'
                ? 'The connection timed out, so delivery is unconfirmed. Your details are still here. Please wait before retrying.'
                : 'We couldn’t connect to the form service. Your details are still here. Try the secure form below, or email contact@erikmagnifico.com.');
        } finally {
            clearTimeout(timeout);
            submitting = false;
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            fields.forEach((field, index) => { field.readOnly = previousReadOnly[index]; });
            form.removeAttribute('aria-busy');
        }
    });
}

document.querySelectorAll('[data-email-form]').forEach(setupEmailForm);

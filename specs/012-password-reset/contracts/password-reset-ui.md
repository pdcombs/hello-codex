# Password Reset UI Contract

## Sign-in

- Visible keyboard-accessible `Forgot password?` link to `/forgot-password`.

## Request page

- Heading `Reset your password`; email field; `Send reset instructions` action.
- Normal/unknown success uses neutral check-email message.
- Bypass success navigates to `/reset-password?token=...` without email claim.
- Loading locks duplicate submit; validation/errors announced.

## Reset page

- Inspect-token loading state; valid state shows read-only email.
- `New password` and `Confirm new password`, both new-password autocomplete.
- Guidance matches create-account requirements.
- Mismatch/policy errors do not consume token.
- Success redirects `/sign-in` with confirmation.
- Invalid/expired/used/superseded state links to new request.

## Accessibility

- Route title focus; polite status; alert failures.
- Keyboard, 320 CSS pixels, 200% zoom, reduced motion, no overflow.

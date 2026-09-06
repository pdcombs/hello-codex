# UI Contract: Clickable Voting Banner

- Open state renders native action named `Voting is now open. Click here to vote`.
- Action occupies full current banner surface.
- Banner and Vote button invoke same access request function.
- Both disable while request is pending.
- Code/account/unrestricted outcomes remain identical.
- Closed state renders neither banner nor Vote entry action under existing rules.

# Security Policy

## Reporting a vulnerability

Please **don't open a public issue** for security problems.

Report it privately through GitHub: go to the repository's **Security** tab and choose **Report a vulnerability**. Include:

- what is affected (route, screen, configuration);
- steps to reproduce or a proof of concept;
- the impact you expect (for example, data from another workspace exposed).

You should get a first reply within 7 days. Once a fix is released, we'll credit you in the advisory unless you prefer otherwise.

## Supported versions

TakeOps has no versioned releases yet. Fixes land on the `main` branch. Keep your installation updated (see [Updating](README.md#updating)).

## Scope

Issues of particular interest:

- access to another workspace's data, or to a production without permission;
- authentication or session bypass;
- exposure of secrets, tokens or sign-in links;
- abuse of the cron route or of stored external URLs.

Problems in your own deployment (for example a weak `AUTH_SECRET` or a database exposed to the internet) are out of scope, but tell us if the docs led you there.

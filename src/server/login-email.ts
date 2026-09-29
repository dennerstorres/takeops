// E-mail do link de login (ADR-040). O link é credencial: nunca vai para log.

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function buildLoginEmail(input: { url: string; host: string }) {
  const url = escapeHtml(input.url);
  const host = escapeHtml(input.host);
  return {
    subject: `Seu link para entrar no ${input.host}`,
    text: `Entre no ${input.host} por este link:\n${input.url}\n\nO link vale por 24 horas e só pode ser usado uma vez. Se não foi você que pediu, ignore este e-mail.\n`,
    html: `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#111;line-height:1.5">
<p>Entre no <strong>${host}</strong> pelo botão abaixo.</p>
<p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;border-radius:8px;text-decoration:none">Entrar</a></p>
<p style="color:#555;font-size:14px">O link vale por 24 horas e só pode ser usado uma vez. Se não foi você que pediu, ignore este e-mail.</p>
</body></html>`,
  };
}

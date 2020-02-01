module.exports = ({ footerText, location: { name, socials } }) => {
  const socialsTemplate = socials.reduce((acc, curr) => acc+`<mj-social-element color="#fff" src="${process.env.CLIENT_API_URL}${curr.img}" href="${curr.url}"></mj-social-element>` ,'');
  return `
    <mj-section>
    <mj-column width="100%" padding="0">
      <mj-social font-size="15px" icon-size="20px" mode="horizontal" padding="0" align="center">
      ${socialsTemplate}
      </mj-social>
      <mj-text color="#445566" font-size="11px" align="center" line-height="16px">
        ${footerText}
      </mj-text>
      <mj-text color="#445566" font-size="11px" align="center" line-height="16px">
        ${name}
      </mj-text>
    </mj-column>
  </mj-section>`
};

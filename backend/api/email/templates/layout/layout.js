module.exports = ({ body, footer, options }) => `
<mjml>
  <mj-head>
    <mj-title></mj-title>
    <mj-preview></mj-preview>
    <mj-attributes>
      <mj-all font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"></mj-all>
      <mj-text font-weight="400" font-size="17px" color="#000000" line-height="24px" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"></mj-text>
    </mj-attributes>
    <mj-style inline="inline">
      .body-section { -webkit-box-shadow: 1px 4px 11px 0px rgba(0, 0, 0, 0.15); -moz-box-shadow: 1px 4px 11px 0px rgba(0, 0, 0, 0.15); box-shadow: 1px 4px 11px 0px rgba(0, 0, 0, 0.15); }
    </mj-style>
    <mj-style inline="inline">
      .text-link { color: #5e6ebf } a { border-bottom: 1px dashed; color: inherit; text-decoration: none; } a:hover { text-decoration: underline; } a:active { color: black; } a:visited { color: purple; }
    </mj-style>
    <mj-style inline="inline">
      .footer-link { color: #888888 }
    </mj-style>
  </mj-head>
  <mj-body background-color="#E7E7E7" width="600px">
    <mj-wrapper padding-top="0" padding-bottom="0" css-class="body-section">
        ${body}
    </mj-wrapper>
    <mj-wrapper full-width="full-width">
      ${footer}
    </mj-wrapper>
  </mj-body>
</mjml>
`;

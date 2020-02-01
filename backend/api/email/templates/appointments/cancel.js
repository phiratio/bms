const template = ({
  user: {
    firstName,
    lastName,
    fullName,
  },
  extraText,
  date,
  time,
}) => `
<mj-section background-color="#ffffff" padding-left="15px" padding-right="15px">
  <mj-column width="100%">
    <mj-text align="center" font-weight="bold" font-size="22px">
      Your appointment was canceled!
    </mj-text>
    <mj-text color="#637381">
      Hey ${firstName},
    </mj-text>
    <mj-text color="#637381">
      This is a cancellation email of your appointment on <b>${date}</b> at <b>${time}</b>
    </mj-text>
    ${ extraText ? `<mj-text color="#637381">Note: <b>${extraText}</b></mj-text>` : '' }
  </mj-column>
  <mj-column width="100%">
    <mj-text color="#637381" font-size="16px">
      If you have questions, use the contact details below to get in touch with us.
    </mj-text>
  </mj-column>
</mj-section>
`;

module.exports = template;

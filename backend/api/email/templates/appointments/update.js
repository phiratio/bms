const template = ({
  user: {
    firstName,
    lastName,
    fullName,
  },
  date,
  time,
  services,
  duration,
  staff,
  price,
  extraText,
  location: {
    name,
    address: {
      streetAddress,
      addressLocality,
      addressRegion,
      postalCode,
    },
    gMaps,
    phoneNumber,
  },
  url
}) => `
<mj-section background-color="#ffffff" padding-left="15px" padding-right="15px">
  <mj-column width="100%">
    <mj-text align="center" color="#25D670" font-weight="bold" font-size="22px">
      Your appointment has been updated!
    </mj-text>
    <mj-text color="#637381">
      Hey ${firstName},
    </mj-text>
    <mj-text color="#637381">
      This email confirms your updated appointment on <b>${date}</b> at <b>${time}</b>. Please find details below:
    </mj-text>
    <mj-raw>

    </mj-raw>
  </mj-column>

  <mj-column background-color="#1a1a1a" border="1px solid #dddddd" border-bottom="0px" width="65%">
    <mj-text color="#ffffff" padding="20px">
      <b>Updated Time</b>
      <br/><b>${date}</b>
      <br/><b>${time}</b>
    </mj-text>
  </mj-column>
  <mj-column border="1px solid #dddddd" width="65%">
    <mj-text color="#637381" padding="20px">
      ${ services ? `Service: <b>${services}</b><br/>` : '' }
      Duration: <b>${duration}</b>
      <br/> Staff: <b>${staff}</b>
      ${ price !== '$0' ? `<br/> Total: <b>${price}</b>` : '' }
      ${ extraText ? `<br/>Note: <b>${extraText}</b>` : '' }
    </mj-text>
    <mj-divider border-width="1px" border-style="dashed" border-color="lightgrey" padding="0 20px" />
    <mj-text color="#637381" padding="20px">
      <b>Address: </b>
      <br/>
      <a href="${gMaps}">
        <b>${name}</b>
        <br/>${streetAddress},
        <br/>${addressLocality}, ${addressRegion} ${postalCode}
      </a>
      <br/>
      <br/>
      <b>Phone number: </b><a href="tel:${phoneNumber}">${phoneNumber}</a>
    </mj-text>
  </mj-column>
  <mj-column width="100%">
    <mj-text color="#637381" font-size="16px">
      If you have questions before your appointment, use the contact details below to get in touch with us.
    </mj-text>
    <mj-text color="#637381" font-size="16px">
      To <b>cancel</b> your appointment before the scheduled time, please click:
    </mj-text>
    <mj-button background-color="#1a1a1a" align="center" color="#ffffff" font-size="17px" font-weight="bold" href="${url}" width="300px">
     My appointment
    </mj-button>
  </mj-column>
  <mj-column width="100%">
    <mj-text align="center" color="#212b35" font-weight="bold" font-size="20px" padding-bottom="0">
      Thanks for booking with us!
    </mj-text>
  </mj-column>
</mj-section>
`;

module.exports = template;

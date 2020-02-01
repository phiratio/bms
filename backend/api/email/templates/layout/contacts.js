module.exports = ({
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
    email,
    website,
    storeHours,
  },
}) => {
  const websiteName = website.split('://')[1];
  const hoursTemplate = storeHours.reduce((acc, curr) => acc+curr+`<br />` ,'');
  return ` <mj-section background-color="#ffffff">
    <mj-column width="100%">
      <mj-divider border-width="1px" border-style="dashed" border-color="lightgrey" padding="0 20px" />
    </mj-column>
    <mj-column width="100%">
      <mj-text color="#212b35" font-weight="bold" font-size="20px" padding-bottom="0">
        Contacts
      </mj-text>
    </mj-column>
    <mj-column width="50%">
      <mj-text color="#212b35" font-size="12px" text-transform="uppercase" font-weight="bold" padding-bottom="0">
        Address
      </mj-text>
      <mj-text color="#637381" font-size="14px" padding-top="0">
        <a color="#637381" href="${gMaps}">
           <b>${name}</b>
            <br/>${streetAddress},
            <br/>${addressLocality}, ${addressRegion} ${postalCode}
        </a>
      </mj-text>
      <mj-text color="#212b35" font-size="12px" text-transform="uppercase" font-weight="bold" padding-bottom="0">
        Email
      </mj-text>
      <mj-text color="#637381" font-size="14px" padding-top="0">
        <a color="#637381" href="mailto:${email}">
          ${email}
        </a>
      </mj-text>
      <mj-text color="#212b35" font-size="12px" text-transform="uppercase" font-weight="bold" padding-bottom="0">
        Website
      </mj-text>
      <mj-text color="#637381" font-size="14px" padding-top="0">
        <a color="#637381" href="${website}">
          ${websiteName}
        </a>
      </mj-text>
    </mj-column>
    <mj-column width="50%">
      <mj-text color="#212b35" font-size="12px" text-transform="uppercase" font-weight="bold" padding-bottom="0">
        Phone Number
      </mj-text>
      <mj-text color="#637381" font-size="14px" padding-top="0">
        <a href="tel:${phoneNumber}">${phoneNumber}</a>
      </mj-text>
      <mj-text color="#212b35" font-size="12px" text-transform="uppercase" font-weight="bold" padding-bottom="0">
        Store hours
      </mj-text>
      <mj-text color="#637381" font-size="14px" padding-top="0">
        ${hoursTemplate}
      </mj-text>
    </mj-column>
  </mj-section>`
};

module.exports = ({ url }) => `
<mj-section background-color="#ffffff">
  <mj-column width="100%">
    <mj-image src="${process.env.CLIENT_API_URL}${url}" width="600px" alt="" padding="0" />
  </mj-column>
</mj-section>
`;

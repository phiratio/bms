import React from 'react';
import { Row, Button, Col } from 'reactstrap';

export default () => {
  return (
    <Row className="text-center align-items-center justify-content-center">
      <Col
        xs={{ size: 8 }}
        sm={{ size: 8 }}
        lg={{ size: 4 }}
      >
        <p>An error occured when trying to fetch data</p>
        <Button
          onClick={() => {
            window.location.reload();
          }}
          className="btn-pill btn-secondary btn-block"
        >
          Try reloading
        </Button>
      </Col>
    </Row>
  )
};

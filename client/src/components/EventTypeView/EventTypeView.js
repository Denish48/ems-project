import React, { useEffect, useState } from "react";
import {
  Card, Row, Col, List, Button
} from "antd";
import {
  showAuthLoader,
  hideAuthLoader,
} from "../../appRedux/actions/Auth";

import { useDispatch } from 'react-redux';
import Service from "../../service";
import EventTypeChart from "../EventTypeChart/EventTypeChart";


const EventTypeView = (props) => {

  const [surveyData, setSurveyData] = useState(null);
  const id = props.match.params.id;

  const dispatch = useDispatch();

  useEffect(() => {
    getsurveyById();
  }, [])

  const getsurveyById = async () => {
    try {
      dispatch(showAuthLoader());
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.surveyById + params,
      });

      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        const surveyView = response.data.data
        setSurveyData(surveyView);
      }
    } catch (error) {
      dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  if (!surveyData) {
    return null;
  }
  const onCancel = () => {
    if (props.history.length > 1) {
      props.history.goBack();
    } else {
      props.history.push('/event-type');
    }
  };
  return (
    <>
      <Card title="Event Type View">
        <Button type="primary" style={{ float: "right" }} onClick={onCancel}>
          Back
        </Button>
        <Row >
          {/* <Col span={14}>
            <List
              itemLayout="horizontal"
            //dataSource={initData}
            >
              <List.Item>Survey Answers : {surveyData?.answers}</List.Item>

            </List>
          </Col> */}
          <Col style={{ marginTop: "25px" }} xl={24} lg={24} md={24} sm={24} xs={24}>
            <div className="cust-card-wrapper propertiescard-wrapper">
              <EventTypeChart props={id}/>
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );
};
export default EventTypeView;

import React, { useState, useEffect } from "react";
import { Card, Form, Button, Input, message } from "antd";
import {
  showAuthLoader,
  hideAuthLoader,
} from "../../appRedux/actions/Auth";

import { useDispatch, useSelector } from 'react-redux';


import Service from "../../service";

const EditEventType = (props) => {
  const [eventApiData, setEventApiData] = useState(null);

  const id = props.match.params.id;
  // const record = eventApiData.find(data => data._id === id);
  const dispatch = useDispatch();
  const { authUser } = useSelector(
    ({ auth }) => auth
  );
  const [form] = Form.useForm();

  useEffect(() => {
    getEventType();
  }, []);

  const getEventType = async () => {
    try {
      dispatch(showAuthLoader());
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.eventTypeById + params,
      });
      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        setEventApiData(response.data.data);
      }
    } catch (error) {
      dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 8 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 16 },
    },
  };

  const tailFormItemLayout = {
    wrapperCol: {
      xs: {
        span: 24,
        offset: 0,
      },
      sm: {
        span: 16,
        offset: 8,
      },
    },
  };

  const handleUpdate = async (values) => {
    try {
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.putMethod,
        api_url: Service.eventsTypeEdit + params,
        body: {
          ...values,
          //org_id: authUser?.org_id._id,
          user_id: authUser?._id,
        },
      });
      if (response.data && response.data.data) {
        setEventApiData(response.data.data);
        props.history.push("/event-type");
        message.success(response.data.message)
      } else {
        message.error(response.data.message)
      }
    } catch (error) {
      console.log(error);
    }
  };
  const onCancel = () => {
    if (props.history.length > 1) {
      props.history.goBack();
    } else {
      props.history.push('/event-type');
    }
  };
  if (!eventApiData) {
    return <></>;
  }

  return (
    <Card className="gx-card" title="Edit Event Type">
      <Form
        layout="vertical"
        {...formItemLayout}
        form={form}
        onFinish={handleUpdate}
        initialValues={{ ...eventApiData }}
      >
        <Form.Item
          label="Event Type "
          name="event_type"
          rules={[
            {
              required: true,
              message: "Please input your Event Type ",
            },
          ]}
        >
          <Input size="large" />
        </Form.Item>
        {
          <Form.Item {...tailFormItemLayout}>
            <Button type="primary" htmlType="submit">
              Update
            </Button>
            <Button type="primary" onClick={onCancel}>
              Back
            </Button>
          </Form.Item>
        }
      </Form>
    </Card>
  );
};

export default EditEventType;

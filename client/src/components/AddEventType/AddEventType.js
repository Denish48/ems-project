import React from "react";
import { Input, Button, Form, Card, message } from "antd";
import { useDispatch, useSelector } from 'react-redux';
import Service from "../../service";
import {
  showAuthLoader,
  hideAuthLoader,
} from "../../appRedux/actions/Auth";
const AddEventType = (props) => {
  const [form] = Form.useForm();
  const { authUser } = useSelector(
    ({ auth }) => auth
  );
  const dispatch = useDispatch();
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
  const onCancel = () => {
    if (props.history.length > 1) {
      props.history.goBack();
    } else {
      props.history.push('/event-type');
    }
  };
  const handleSubmit = async (values, e) => {
    const { event_type } = values

    try {
      dispatch(showAuthLoader());

      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.eventTypeAdd,
        body: {
          event_type: event_type?.trim(),
          org_id: authUser?.org_id._id,
          user_id: authUser?._id,
        },
      });
      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        props.history.push("/event-type");
        message.success(response.data.message)
      } else {
        message.error(response.data.message)
      }
    } catch (e) {
      dispatch(hideAuthLoader());
      console.log("err occured:" + e);
    }
  };
  const validator = (rule, value) => {
    if (rule.field === 'event_type') {
      if (value && !/^[^-\s][a-zA-Z0-9_\s-]+$/.test(value)) {
        return Promise.reject('Please enter valid event type!');
      } else {
        return Promise.resolve();
      }
    } else {
      return Promise.resolve();
    }
  }


  return (
    <>
      <Card className="gx-card" title="Add Event Type">
        <Form
          layout="vertical"
          form={form}
          {...formItemLayout}
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Event Type Name"
            name="event_type"
            rules={[
              {
                required: true,
                message: "Please enter your Event Type!",
              },
              { validator: validator }

            ]}
          >
            <Input type="text" />
          </Form.Item>
          <Form.Item {...tailFormItemLayout}>
            <Button id="addbutton" type="primary" htmlType="submit">
              Submit
            </Button>
            <Button type="primary" onClick={onCancel}>
              Back
            </Button>
          </Form.Item>
        </Form>
      </Card>

    </>
  );
};

export default AddEventType;

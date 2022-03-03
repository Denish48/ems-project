import React, { useEffect, useState } from "react";
import { Card, Form, Select, Button, Input, message } from "antd";
import {
  showAuthLoader,
  hideAuthLoader,
} from "../../appRedux/actions/Auth";
import Service from "../../service";
import { useDispatch, useSelector } from "react-redux";
const { Option } = Select;
const AddNotification = (props) => {
  const [departmentList, setDepartmentList] = useState([]);
  const [EventDropdownList, setEventDropdownList] = useState([]);
  const dispatch = useDispatch();
  const { authUser } = useSelector(
    ({ auth }) => auth
  );
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
  useEffect(() => {
    getDepartmentList();
    getEventList();
  }, []);

  const getEventList = async () => {
    try {
      dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.eventDropdownList,
      });

      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        setEventDropdownList(response.data.data);
      }
    } catch (error) {
      dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const getDepartmentList = async () => {
    try {
      dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.departmentDropdownList,
      });

      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        setDepartmentList(response.data.data);
      }
    } catch (error) {
      dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const setCustomNotification = async (values) => {
    try {
      dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.customNotification,
        body: {
          ...values,
          user_id: authUser?._id,
        }
      });
      dispatch(hideAuthLoader());
      if (response.data) {
        props.history.push("/notification")
        message.success(response.data.message)
      }
      else {
        message.error(response.data.message)
      }
    } catch (error) {
      dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const onCancel = () => {
    if (props.history.length > 1) {
      props.history.goBack();
    } else {
      props.history.push('/notification');
    }
  };
  const validator = (rule, value) => {
    if (rule.field === 'title') {
      if (value && !/^[^-\s][a-zA-Z0-9_\s-]+$/.test(value)) {
        return Promise.reject('Please enter valid title!');
      } else {
        return Promise.resolve();
      }
    } else if (rule.field === 'message') {
      if (value && !/^[^-\s][a-zA-Z0-9_\s-]+$/.test(value)) {
        return Promise.reject('Please enter valid message!');
      } else {
        return Promise.resolve();
      }
    } else {
      return Promise.resolve();
    }
  }

  return (
    <Card className="gx-card" title="Add Notifiction">
      <Form layout="vertical" {...formItemLayout} onFinish={setCustomNotification}>

        <Form.Item
          label="Title"
          name="title"
          rules={[
            {
              required: true,
              message: "Please enter your Title type!",
            },
            { validator: validator }
          ]}
        >
          <Input size="large" />
        </Form.Item>
        <Form.Item
          label="Message"
          name="message"
          rules={[
            {
              required: true,
              message: "Please enter your Message!",
            },
            { validator: validator }

          ]}
        >
          <Input size="large" />
        </Form.Item>

        <Form.Item
          label="Event Name"
          name="event_id"
          rules={[
            {
              required: true,
              message: "Please enter your Event Name!",
            },
          ]}
        >
          <Select
            size="large"
            showSearch
            mode="multiple"
            // optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            filterSort={(optionA, optionB) =>
              optionA.children
                .toLowerCase()
                .localeCompare(optionB.children.toLowerCase())
            }
          >
            {EventDropdownList.map((item, index) => (
              <Option key={index} value={item._id} style={{ textTransform: "capitalize" }}>
                {item.event_name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="Department"
          name="department_id"
          rules={[
            {
              required: true,
              message: "Please enter your Department!",
            },
          ]}
        >
          <Select
            size="large"
            mode="multiple"
            showSearch
            // optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            filterSort={(optionA, optionB) =>
              optionA.children
                .toLowerCase()
                .localeCompare(optionB.children.toLowerCase())
            }
          >
            {departmentList.map((item, index) => (
              <Option key={index} value={item._id} style={{ textTransform: "capitalize" }}>
                {item.department_name}
              </Option>
            ))}
          </Select>
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
  );
};

export default AddNotification;

import React, { useState, useCallback } from "react";
import { Input, Modal, Button, Form, Card, message } from "antd";
import Service from "../../service";
import { useDispatch, useSelector } from "react-redux";
import {
  // showAuthLoader,
  hideAuthLoader,
} from "../../appRedux/actions/Auth";
const AddDepartment = (props) => {
  const [IsModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { authUser } = useSelector(
    ({ auth }) => auth
  );
  const handleCancel = useCallback(() => {
    form.resetFields();
    setIsModalVisible(false);
  }, [form]);

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

  const onFinish = async (values) => {
    try {
      // dispatch(showAuthLoader());
      const { department_name } = values;

      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.departmentAdd,
        body: {
          department_name: department_name?.trim(),
          // ...values,
          org_id: authUser?.org_id?._id,
          user_id: authUser?._id
        },
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        props.history.push("/department");
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
  const validator = (rule, value) => {
    if (rule.field === 'department_name') {
      if (value && !/^[^-\s][a-zA-Z0-9_\s-,\/().]+$/.test(value)) {
        return Promise.reject('Please enter valid department name!');
      } else {
        return Promise.resolve();
      }
    } else {
      return Promise.resolve();
    }
  }
  const onCancel = () => {
    if (props.history.length > 1) {
      props.history.goBack();
    } else {
      props.history.push('/department');
    }
  };

  return (
    <>
      <Card className="gx-card" title="Add Department">
        <Form
          layout="vertical"
          onFinish={onFinish}
          form={form}
          {...formItemLayout}
        >
          <Form.Item
            label="Department Name"
            name="department_name"
            rules={[
              {
                required: true,
                message: "Please enter your department!",
              },
              { validator: validator }
            ]}
          >
            <Input size="large" type="text" />
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

      <Modal
        title="Update Employee Details"
        visible={IsModalVisible}
        okText="Update"
        onOk={form.submit}
        onCancel={handleCancel}
      >
        <Form
          layout="vertical"
          form={form}
        >
          <Form.Item
            label="Department"
            name="department_name"
            rules={[
              { required: true, message: "Please enter your Department name!" },
            ]}
          >
            <Input type="text" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AddDepartment;

import React, { useState, useEffect, useCallback } from "react";
import { Input, Modal, Button, Form, Card, Select, Checkbox, message } from "antd";
import Service from "../../service";
import { useDispatch, useSelector } from "react-redux";
import {
  showAuthLoader,
  hideAuthLoader,
} from "../../appRedux/actions/Auth";
const { Option } = Select;
const AddTrainer = (props) => {
  const [IsModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [employeeList, setEmployeeList] = useState([]);
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
    getEmployeeList();
  }, []);

  const handleCancel = useCallback(() => {
    form.resetFields();
    setIsModalVisible(false);
  }, [form]);
  const onCancel = () => {
    if (props.history.length > 1) {
      props.history.goBack();
    } else {
      props.history.push('/event');
    }
  };

  const getEmployeeList = async () => {
    try {
      dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.employeesDropdownList,
        body: {
          emp_id: authUser._id,
        }
      });
      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        setEmployeeList(response.data.data);
      }
    } catch (error) {
      dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  const addTrainerDetails = async (values) => {
    try {
      dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.addTrainner,
        body: {
          ...values,
          user_id: authUser?._id,
          org_id: authUser?.org_id._id,
        },
      });
      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        props.history.push("/host");
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

  return (
    <>
      <Card className="gx-card" title="Add Host">
        <Form
          layout="vertical"
          onFinish={addTrainerDetails}
          form={form}
          {...formItemLayout}
          initialValues={{ isExternal: true }}
        >
          <Form.Item
            name="isExternal"
            valuePropName="checked"
            wrapperCol={{ offset: 8, span: 16 }}
          >
            <Checkbox>External</Checkbox>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.isExternal !== currentValues.isExternal
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("isExternal") === true ? (
                <>
                  <Form.Item
                    label="First Name"
                    name="first_name"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your First Name!",
                      },
                    ]}
                  >
                    <Input size="large" type="text" />
                  </Form.Item>
                  <Form.Item
                    label="Last Name"
                    name="last_name"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your Last Name!",
                      },
                    ]}
                  >
                    <Input size="large" type="text" />
                  </Form.Item>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your Email!",
                      },
                    ]}
                  >
                    <Input size="large" type="email" />
                  </Form.Item>
                  <Form.Item
                    label="Phone Number"
                    name="phone_number"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your Phone Number!",
                      },
                    ]}
                  >
                    <Input size="large" type="number" />
                  </Form.Item>
                  <Form.Item
                    label="Designation"
                    name="designation"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your Designation!",
                      },
                    ]}
                  >
                    <Input size="large" type="text" />
                  </Form.Item>
                  <Form.Item
                    label="Description"
                    name="description"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your Description!",
                      },
                    ]}
                  >
                    <Input size="large" type="text" />
                  </Form.Item>
                </>
              ) : (
                <Form.Item
                  label="Employee Name"
                  name="user_id"
                  rules={[
                    {
                      required: true,
                      message: "Please select Employee Name!",
                    },
                  ]}
                >
                  <Select size="large">
                    {employeeList.map((item, index) => (
                      <Option key={index} value={item._id}
                        style={{ textTransform: "capitalize" }}>
                        {item.first_name + " " + item.last_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )
            }
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
            name="department"
            rules={[
              { required: true, message: "Please enter your Department!" },
            ]}
          >
            <Input type="text" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AddTrainer;

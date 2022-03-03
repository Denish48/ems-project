import React, { useState, useEffect } from "react";
import { Card, Form, Button, Input } from "antd";
import Service from "../../service";
import {
  showAuthLoader,
  hideAuthLoader,
} from "../../appRedux/actions/Auth";

import { useDispatch, useSelector } from 'react-redux';

const EditDepartment = (props) => {
  const [deptApiData, setdeptApiData] = useState(null);
  const id = props.match.params.id;
  const [form] = Form.useForm();
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
    getDepartmentById();
  }, []);
  const getDepartmentById = async () => {
    try {
      dispatch(showAuthLoader());
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.departmentById + params,
      });
      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        setdeptApiData(response.data.data);
      }
    } catch (error) {
      dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const handleUpdate = async (values) => {
    try {
      dispatch(showAuthLoader());
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.putMethod,
        api_url: Service.editDepartment + params,
        body: {
          ...values,
          user_id: authUser?._id,
        },
      });
      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        props.history.push("/department");
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
      props.history.push('/department');
    }
  };
  if (!deptApiData) {
    return <></>;
  }

  return (
    <Card className="gx-card" title="Edit Department Name">
      <Form
        layout="vertical"
        {...formItemLayout}
        form={form}
        onFinish={handleUpdate}
        initialValues={deptApiData}
      >
        <Form.Item
          label="Department Name"
          name="department_name"
          rules={[
            {
              required: true,
              message: "Please enter your department name",
            },
          ]}
        >
          <Input size="large" />
        </Form.Item>
        {
          <Form.Item {...tailFormItemLayout}>
            <Button id="addbutton" type="primary" htmlType="submit">
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

export default EditDepartment;

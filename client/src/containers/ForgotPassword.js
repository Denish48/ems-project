import React from "react";
import { Button, Input, message, Form } from "antd";
import ElsnerElevate from "assets/images/ElsnerElevate.svg";
import Service from "../service";
import { Link } from "react-router-dom";

const ForgetPassword = () => {
  const handleSubmit = async (values) => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.forgotPassword,
        body: values,
      });
      if (response?.status === 200) {
        console.log(response?.data?.message);
        message.success(response?.data?.message);
      } else {
        message.error(response?.data?.message);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  return (
    <>
      <div className="gx-app-login-wrap">
        <div className="gx-app-login-container">
          <div className="gx-app-login-main-content">
            <div className="gx-app-logo-content">
              <div className="gx-app-logo" style={{ paddingBottom: "70px" }}>
                <img alt="example" src={ElsnerElevate} />
              </div>
            </div>
            <div className="gx-app-login-content">
              <h1>Trouble Logging in?</h1>
              <Form onFinish={handleSubmit}>
                <Form.Item
                  name="email"
                  rules={[
                    {
                      type: "email",
                      message: "The input is not valid E-mail!",
                    },
                    {
                      required: true,
                      message: "Please input your E-mail!",
                    },
                  ]}
                >
                  <Input placeholder="Email" />
                </Form.Item>
                <p className="form-text">
                  Enter Your Email, we'll send you the link!
                </p>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Send a Reset Link
                  </Button>
                  <Link
                    type="button"
                    to="/signin"
                    className={"ant- btn ant-btn-secondary"}
                  >
                    Back
                  </Link>
                </Form.Item>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgetPassword;

import React from 'react';

import { Button, Input, message, Form } from "antd";
import ElsnerElevate from "assets/images/ElsnerElevate.svg";
import Service from '../service';

const ResetPassword = (props) => {

    const handleSubmit = async (values) => {

        try {
            const token = props.match?.params?.token || props.computedMatch?.params?.token;

            if (typeof token === 'undefined' || token === null || token === '') {
                return message.error("Reset token not found!");
            }
            const response = await Service.makeAPICall({
                methodName: Service.postMethod,
                api_url: Service.resetPassword,
                body: {
                    email: values?.email,
                    password: values?.password,
                    emailResetToken: token
                }
            });
            console.log(response);
            if (response?.data) {
                console.log(response?.data?.message);
                message.success(response?.data?.message)
                props.history.push('/signin')
            } else {
                message.error(response?.data?.message);
            }
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <>
            <div className="gx-app-login-wrap">
                <div className="gx-app-login-container">
                    <div className="gx-app-login-main-content">
                        <div className="gx-app-logo-content">
                            <div className="gx-app-logo" style={{ paddingBottom: "70px" }}>
                                <img
                                    alt="example"
                                    src={ElsnerElevate}
                                />
                            </div>
                        </div>
                        <div className="gx-app-login-content">
                            <Form
                                className="gx-signin-form gx-form-row0"
                                onFinish={handleSubmit}
                            >
                                <Form.Item
                                    rules={[
                                        { required: true, message: "Please enter valid E-mail!" },
                                    ]}
                                    name="email"
                                    label="Email"
                                >
                                    <Input type="email" placeholder="Email" />
                                </Form.Item>
                                <Form.Item
                                    label="Password"
                                    name="password"
                                    hasFeedback
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Please enter your password!',
                                        },
                                    ]}

                                >
                                    <Input.Password />
                                </Form.Item>

                                <Form.Item
                                    name="confirm"
                                    label="Confirm Password"
                                    hasFeedback
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Please confirm your password!',
                                        },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('password') === value) {
                                                    return Promise.resolve()
                                                }
                                                return Promise.reject(
                                                    'The two passwords that you entered do not match!'
                                                )
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password />
                                </Form.Item>
                                <Form.Item >
                                    <Button id="addbutton" htmlType="submit">
                                        Reset Password
                                    </Button>
                                </Form.Item>
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
};

export default ResetPassword;

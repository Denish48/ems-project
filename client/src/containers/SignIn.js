import React from "react";
import { Button, Input, message, Form } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Service from "../service";

// import ElsnerElevate from "assets/images/ElsnerElevate.svg";
import Logowhite from "assets/images/Logowhite.svg";
import icons8lock from "assets/images/icons8-lock.svg";
import {
  showAuthLoader,
  hideAuthLoader,
  userSignInSuccess,
} from "../appRedux/actions/Auth";
import IntlMessages from "../util/IntlMessages";


const SignIn = () => {
  const dispatch = useDispatch();
  const { loader, alertMessage, showMessage } = useSelector(
    ({ auth }) => auth
  );
  const Logo = localStorage.getItem('LogoURL');

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  const onFinish = async (values) => {
    try {
      dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.login,
        body: values,
      });
      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        const userData = response.data.data;
        localStorage.setItem("user_data", JSON.stringify(userData));
        localStorage.setItem("accessToken", response.data.authToken.accessToken);
        localStorage.setItem("refreshToken", response.data.authToken.refreshToken);
        dispatch(userSignInSuccess(userData));
        message.success(response.data.message)
      } else {
        const msg = response.data.message;
        const index = Service.add_message(msg);
        if (index === -1) {
          message.error(msg).then(() => {
            Service.remove_message(msg);
          });
        }
      }
    } catch (error) {
      dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  return (
    <div className="gx-app-login-wrap account-login">
      <div className="gx-app-login-container">
        <div className="gx-app-login-main-content">
          <div className="gx-app-logo-content">
            {/* <div className="gx-app-logo-content-bg">

                <img src={"https://via.placeholder.com/272x395"} alt='Neature'/>
              </div> */}

            <div className="gx-app-logo" style={{ paddingBottom: "80px" }}>
              {Logo ? (
                <img
                  alt="example"
                  src={Logo}
                />
              ) : (
                <img
                  alt="example"
                  src={Logowhite}
                />
              )}

            </div>
            <div className="gx-app-login-left-content">
              <h6>Welcome to,</h6>
              <h2>Elsner's Events Network</h2>
            </div>
          </div>
          <div className="gx-app-login-content">
            <div className="gx-app-logo-wid">
              <h1>
                <IntlMessages id="app.userAuth.signIn" />
              </h1>
            </div>
            <Form
              name="basic"
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              className="gx-signin-form gx-form-row0"

            >
              <div className="form-label">
                <span><label>Email</label></span>
              </div>
              <div className="form-content">
                <Form.Item
                  rules={[
                    {
                      required: true,
                      message: 'Please enter your E-mail!',
                    },
                    {
                      type: 'email',
                      message: 'Please enter valid E-mail Address',
                    },
                  ]}
                  name="email"
                >
                  <Input type="email" placeholder="Email" />
                </Form.Item>
                <span className="login-icon"><i className="fas fa-envelope"></i></span>
              </div>
              <div className="form-label">
                <span><label>Password</label></span>
                {/* <span>Forgot Password?</span> */}
              </div>
              <div className="form-content">
                <Form.Item
                  name="password"
                  rules={[
                    {
                      required: true,
                      message: 'Please input your password!',
                    },
                  ]}
                >
                  <Input.Password placeholder="Password" />

                </Form.Item>
                <span className="login-icon lock">
                  <img src={icons8lock} alt="icons" />
                </span>
              </div>
              <Form.Item>
                <Button type="primary" className="gx-mb-0" htmlType="submit">
                  <IntlMessages id="app.userAuth.signIn" />
                </Button>
              </Form.Item>
              <Form.Item>
                <center>Forgot your Login details?
                  <Link to="/forgot-password">&nbsp;Get help logging in.</Link></center>

              </Form.Item>
            </Form>
          </div>

          {loader ? (
            <div className="gx-loader-view">{/* <CircularProgress/> */}</div>
          ) : null}
          {showMessage ? message.error(alertMessage.toString()) : null}
        </div>
      </div>
    </div>
  );
};

export default SignIn;
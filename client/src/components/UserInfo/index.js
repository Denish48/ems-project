import React from "react";
import { useDispatch } from "react-redux";
import { Avatar, Popover } from "antd";
import { withRouter } from "react-router-dom";
import { userSignOut } from "appRedux/actions/Auth";
import ProfileImage from "../../assets/images/default_profile.jpg"

const UserInfo = (props) => {

  const dispatch = useDispatch();

  const userMenuOptions = (
    <ul className="gx-user-popover">
      <li onClick={() => props.history.push('/admin-edit')}>Edit Profile </li>
      <li onClick={() => dispatch(userSignOut())}>Logout
      </li>
    </ul>
  );

  return (
    <Popover overlayClassName="gx-popover-horizantal" placement="bottomRight" content={userMenuOptions}
      trigger="click">
      <Avatar src={ProfileImage}
        className="gx-avatar gx-pointer" alt="" />
    </Popover>
  )

}

export default withRouter(UserInfo);

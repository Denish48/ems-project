import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, Popover } from "antd";
import { userSignOut } from "../../appRedux/actions/Auth";
import ProfileImage from "../../assets/images/default_profile.jpg";
import { withRouter } from "react-router-dom";
import Service from "../../service";

const UserProfile = (props) => {
  const dispatch = useDispatch();

  const { authUser } = useSelector(
    ({ auth }) => auth
  );
  const first_name = authUser.first_name.charAt(0).toUpperCase() + authUser.first_name.slice(1);
  const last_name = authUser.last_name.charAt(0).toUpperCase() + authUser.last_name.slice(1);
  const userName = first_name + ' ' + last_name;

  const userMenuOptions = (

    <ul className="gx-user-popover">
      <li onClick={() => props.history.push('/admin-edit')}>
        Edit Profile
      </li>
      <li onClick={() => dispatch(userSignOut())}>Logout</li>
    </ul>
  );

  return (
    <div className="gx-flex-row gx-align-items-center gx-avatar-row">
      <Popover
        placement="bottomRight"
        content={userMenuOptions}
        trigger="click"
      >
        <Avatar
          src={
            authUser.user_img ?
              `${Service.Server_Base_URL}/uploads/user_images/${authUser.user_img}`
              : ProfileImage}
          className="gx-size-40 gx-pointer gx-mr-3"
          alt=""
        />
        <span className="gx-avatar-name">
          {userName}
          <i className="icon icon-chevron-down gx-ml-2" />
        </span>
      </Popover>
    </div>
  );
};

export default withRouter(UserProfile);

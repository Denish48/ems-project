import React, { useState } from "react";
import { Layout } from "antd";
import { Link } from "react-router-dom";
import UserInfo from "../../components/UserInfo";
import Auxiliary from "../../util/Auxiliary";
import { toggleCollapsedSideNav } from "../../appRedux/actions";
import { NAV_STYLE_DRAWER, NAV_STYLE_FIXED, NAV_STYLE_MINI_SIDEBAR, TAB_SIZE } from "../../constants/ThemeSetting";
import { useDispatch, useSelector } from "react-redux";
import UserProfile from "../Sidebar/UserProfile";

const { Header } = Layout;

const Topbar = () => {
  const { navStyle } = useSelector(({ settings }) => settings);
  const { navCollapsed, width } = useSelector(({ common }) => common);
  const [isActive, setActive] = useState(false);

  const dispatch = useDispatch();
  const toggleClass = () => {
    setActive(!isActive);
  };
  return (
    <Header>
      {navStyle === NAV_STYLE_DRAWER || ((navStyle === NAV_STYLE_FIXED || navStyle === NAV_STYLE_MINI_SIDEBAR) && width < TAB_SIZE) ?
        <div className="gx-linebar gx-mr-3">
          <i className="gx-icon-btn icon icon-menu"
            onClick={() => {
              dispatch(toggleCollapsedSideNav(!navCollapsed));
            }}
          />
        </div> : null}
      <Link to="/" className={isActive ? "gx-d-block gx-pointer logo-wraper" : "gx-site-logo gx-d-none"} onClick={toggleClass}>
        <img alt="" src={require("assets/images/ElsnerElevate.svg")} />
      </Link>
      {/* 
      <SearchBox styleName="gx-d-none gx-d-lg-block gx-lt-icon-search-bar-lg"
                 placeholder="Search in app..."
                 onChange={updateSearchChatUser}
                 value={searchText}/>
      */}
      <ul className="gx-header-notifications gx-ml-auto">
        <li className="gx-notify gx-notify-search gx-d-inline-block gx-d-lg-none">
          {/* <Popover overlayClassName="gx-popover-horizantal" placement="bottomRight" content={
            <SearchBox styleName="gx-popover-search-bar"
                       placeholder="Search in app..."
                       onChange={updateSearchChatUser}
                       value={searchText}/>
          } trigger="click">
            <span className="gx-pointer gx-d-block"><i className="icon icon-search-new"/></span>
          </Popover>
      */}
        </li>
        {width >= TAB_SIZE ? null :
          <Auxiliary>
            <li className="gx-notify">
              {/* <Popover overlayClassName="gx-popover-horizantal" placement="bottomRight" content={<AppNotification/>}
                       trigger="click">
                <span className="gx-pointer gx-d-block"><i className="icon icon-notification"/></span>
              </Popover> */}
            </li>

            <li className="gx-msg">
              {/* <Popover overlayClassName="gx-popover-horizantal" placement="bottomRight"
                       content={<MailNotification/>} trigger="click">
                  <span className="gx-pointer gx-status-pos gx-d-block">
                    <i className="icon icon-chat-new"/>
                    <span className="gx-status gx-status-rtl gx-small gx-orange"/>
                  </span>
              </Popover> */}
            </li>
          </Auxiliary>
        }
        <li className="gx-language">

        </li>
        {width >= TAB_SIZE ? <UserProfile /> :
          <Auxiliary>
            <li className="gx-user-nav"><UserInfo /></li>
          </Auxiliary>
        }
      </ul>
    </Header>
  );
};

export default Topbar;

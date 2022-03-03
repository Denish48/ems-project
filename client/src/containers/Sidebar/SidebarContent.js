import React from "react";
import { Menu } from "antd";
import { NavLink, useLocation } from "react-router-dom";

import CustomScrollbars from "util/CustomScrollbars";
import SidebarLogo from "./SidebarLogo";
import {
  THEME_TYPE_LITE
} from "../../constants/ThemeSetting";
import IntlMessages from "../../util/IntlMessages";
import { useSelector } from "react-redux";
// import { footerText } from "util/config";

// const SubMenu = Menu.SubMenu;
// const MenuItemGroup = Menu.ItemGroup;


const SidebarContent = ({ sidebarCollapsed, setSidebarCollapsed, ...props }) => {
  let { themeType } = useSelector(({ settings }) => settings);
  let { pathname } = useSelector(({ common }) => common);
  let location = useLocation();

  const selectedKeys = pathname.substr(1);
  const defaultOpenKeys = selectedKeys.split('/')[1];
  return (
    <>
      <SidebarLogo sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
      <div className="gx-sidebar-content">

        <CustomScrollbars className="gx-layout-sider-scrollbar">
          <Menu
            defaultOpenKeys={[defaultOpenKeys]}
            selectedKeys={[selectedKeys]}
            theme={themeType === THEME_TYPE_LITE ? 'lite' : 'dark'}
            mode="inline">

            <Menu.Item key="dashboard">
              <NavLink activeClassName="active" to="/dashboard">
                <i className="icon icon-dasbhoard" />
                <span><IntlMessages id="sidebar.dashboard.crypto" /></span>
              </NavLink>
            </Menu.Item>
            <Menu.Item key="event" className={location.pathname?.includes('/event/') ? 'ant-menu-item-active ant-menu-item-selected' : ''}>
              <NavLink activeClassName="active" to="/event"><i className="icon icon-widgets" /><span><IntlMessages
                id="sidebar.event" /></span></NavLink>
            </Menu.Item>

            <Menu.Item key="live-event">
              <NavLink activeClassName="active" to="/live-event"><i className="icon icon-calendar" /><span><IntlMessages
                id="sidebar.live-event" /></span></NavLink>
            </Menu.Item>
            <Menu.Item key="upcoming-event">
              <NavLink activeClassName="active" to="/upcoming-event"><i className="icon icon-calendar" /><span><IntlMessages
                id="sidebar.upcoming-event" /></span></NavLink>
            </Menu.Item>
            <Menu.Item key="previous-event">
              <NavLink activeClassName="active" to="/previous-event"><i className="icon icon-calendar" /><span><IntlMessages
                id="sidebar.previous-event" /></span></NavLink>
            </Menu.Item>
            <Menu.Item key="event-type" className={location.pathname?.includes('/event-type') ? 'ant-menu-item-active ant-menu-item-selected' : ''}>
              <NavLink activeClassName="active" to="/event-type"><i className="icon icon-tag-o" /><span><IntlMessages
                id="sidebar.event-type" /></span></NavLink>
            </Menu.Item>
            <Menu.Item key="host">
              <NavLink activeClassName="active" to="/host"><i className="icon icon-calendar" /><span><IntlMessages
                id="sidebar.host" /></span></NavLink>
            </Menu.Item>
            <Menu.Item key="department" className={location.pathname?.includes('/department') ? 'ant-menu-item-active ant-menu-item-selected' : ''}>
              <NavLink activeClassName="active" to="/department"><i className="icon icon-company" /><span><IntlMessages
                id="sidebar.department" /></span></NavLink>
            </Menu.Item>
            
            <Menu.Item key="employee" className={location.pathname?.includes('/employee') ? 'ant-menu-item-active ant-menu-item-selected' : ''}>
              <NavLink activeClassName="active" to="/employee"><i className="icon icon-contacts" /><span><IntlMessages
                id="sidebar.employee" /></span></NavLink>
            </Menu.Item>
            <Menu.Item key="notification" className={location.pathname?.includes('/notification') ? 'ant-menu-item-active ant-menu-item-selected' : ''}>
              <NavLink activeClassName="active" to="/notification"><i className="icon icon-notification-new" /><span><IntlMessages
                id="sidebar.notification" /></span></NavLink>
            </Menu.Item>
            <Menu.Item key="birthday" className={location.pathname?.includes('/birthday') ? 'ant-menu-item-active ant-menu-item-selected' : ''}>
              <NavLink activeClassName="active" to="/birthday"><i className="icon fas fa-birthday-cake" /><span><IntlMessages
                id="sidebar.birthday" /></span></NavLink>
            </Menu.Item>
            <Menu.Item key="templates" className={location.pathname?.includes('/templates') ? 'ant-menu-item-active ant-menu-item-selected' : ''}>
              <NavLink activeClassName="active" to="/templates"><i className="icon far fa-address-card" /><span><IntlMessages
                id="sidebar.templates" /></span></NavLink>
            </Menu.Item>
            <Menu.Item key="elevate-forms" className={location.pathname?.includes('/elevate-forms') ? 'ant-menu-item-active ant-menu-item-selected' : ''}>
              <NavLink activeClassName="active" to="/elevate-forms"><i className="icon icon-feedback" /><span><IntlMessages
                id="sidebar.elevate-forms" /></span></NavLink>
            </Menu.Item>

            {/* <Menu.Item key="feedback">
              <NavLink activeClassName="active" to="/feedback"><i className="icon icon-feedback" /><span><IntlMessages
                id="sidebar.feedback" /></span></NavLink>
            </Menu.Item> */}

            <Menu.Item key="settings">
              <NavLink activeClassName="active" to="/setting"><i className="icon icon-extra-components" /><span><IntlMessages
                id="sidebar.settings" /></span></NavLink>
            </Menu.Item>

          </Menu>
          {/* <p>
            {footerText}
          </p> */}
        </CustomScrollbars>
      </div>
    </>
  );
};

SidebarContent.propTypes = {};
export default SidebarContent;
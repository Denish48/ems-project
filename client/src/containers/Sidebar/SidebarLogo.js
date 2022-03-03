import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  NAV_STYLE_DRAWER,
  NAV_STYLE_FIXED,
  NAV_STYLE_MINI_SIDEBAR,
  NAV_STYLE_NO_HEADER_MINI_SIDEBAR,
  TAB_SIZE,
  THEME_TYPE_LITE
} from "../../constants/ThemeSetting";

// import ElsnerElevate from "assets/images/ElsnerElevate.svg";
import Logowhite from "assets/images/Logowhite.svg";
import Service from '../../service';


const SidebarLogo = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const { width, themeType } = useSelector(({ settings }) => settings);
  const { authUser } = useSelector(
    ({ auth }) => auth
  );
  const [sideBarlogo, setSideBarlogo] = useState();
  const LogoAction = useSelector((state) => state.common);
  //console.log(LogoAction.logo);
  const Logo = localStorage.getItem('LogoURL'); 

  useEffect(()=>{
    getAdminListLogo();
  }, [LogoAction.logo])

  const getAdminListLogo = async () => {
    try {
      const params = `/${authUser?.org_id?._id}`;
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.adminSetting + params,
      });
      if (response.data?.data?.config?.adminSetting?.logo) {
        setSideBarlogo(response.data.data.config.adminSetting.logo)
      } else {
        if(LogoAction.logo){
          setSideBarlogo(LogoAction.logo)
        } else if(Logo){
          setSideBarlogo(Logo)
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  let navStyle = useSelector(({ settings }) => settings.navStyle);
  if (width < TAB_SIZE && navStyle === NAV_STYLE_FIXED) {
    navStyle = NAV_STYLE_DRAWER;
  }
  return (
    <div className="gx-layout-sider-header">
      {(navStyle === NAV_STYLE_FIXED || navStyle === NAV_STYLE_MINI_SIDEBAR) ? <div className="gx-linebar">
        <i
          className={`gx-icon-btn icon icon-${!sidebarCollapsed ? 'menu-unfold' : 'menu-fold'} ${themeType !== THEME_TYPE_LITE ? 'gx-text-white' : ''}`}
          onClick={() => {
            setSidebarCollapsed(!sidebarCollapsed)
          }}
        />
      </div> : null}

      <Link to="/dashboard" className="gx-site-logo">

        {sideBarlogo? (
          <img alt="" src={sideBarlogo} />
        ) :
          navStyle === NAV_STYLE_NO_HEADER_MINI_SIDEBAR && width >= TAB_SIZE ?
            <img alt="lo" src={require("assets/images/Favicon_EEMS.png")} /> :
            themeType === THEME_TYPE_LITE ?
              <img alt="logo1" src={Logowhite} /> :
              <img alt="logo2" src={Logowhite} />
        }
        {/* <img alt="" src={sideBarlogo} /> */}
      </Link>
    </div>
  );
};

export default SidebarLogo;

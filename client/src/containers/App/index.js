import React, { memo, useEffect, useState, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import URLSearchParams from 'url-search-params'
import { Redirect, Route, Switch, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { ConfigProvider, message } from 'antd';
import { IntlProvider } from "react-intl";
import Service from '../../service';
import ElsnerElevate from "assets/images/ElsnerElevate.svg";
import AppLocale from "lngProvider";
import MainApp from "./MainApp";
import SignIn from "../SignIn";
import ForgotPassword from "../ForgotPassword";
import ResetPassword from "../ResetPassword";
import {
  setInitUrl,
  userSignInSuccess,
} from "appRedux/actions/Auth";
import { onLayoutTypeChange, onNavStyleChange, setThemeType } from "appRedux/actions/Setting";
import CircularProgress from "../../components/CircularProgress";


import {
  LAYOUT_TYPE_BOXED,
  LAYOUT_TYPE_FRAMED,
  LAYOUT_TYPE_FULL,
  NAV_STYLE_ABOVE_HEADER,
  NAV_STYLE_BELOW_HEADER,
  NAV_STYLE_DARK_HORIZONTAL,
  NAV_STYLE_DEFAULT_HORIZONTAL,
  NAV_STYLE_INSIDE_HEADER_HORIZONTAL,
  THEME_TYPE_DARK
} from "../../constants/ThemeSetting";

const RestrictedRoute = ({ component: Component, location, authUser, ...rest }) => {
  const history = useHistory();
  const dispatch = useDispatch();
  const [isUserTokenVerified, setIsUserTokenVerified] = useState(false);
  const accessToken = localStorage.getItem("accessToken") ? localStorage.getItem("accessToken") : null;

  useEffect(() => {
    favicon(authUser);
  }, [])
  useEffect(() => {
    getUserInfo();
  }, [history.location.pathname]);
  const getUserInfo = async () => {
    try {
      if (!authUser || !authUser._id) {
        history.push("/signin");
        return;
      }
      const params = `/${authUser._id}`;
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.userById + params,
      })
      if (!response) {
        return Service.messageError(Service.error_message)
      }
      if (response.data && response.data.data) {
        const userData = response.data.data;
        localStorage.setItem("user_data", JSON.stringify(userData));
        dispatch(userSignInSuccess(response.data.data));
        setIsUserTokenVerified(true)
      } else {
        history.push("/signin");
        Service.messageError(response.data.message)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const favicon = async (userData) => {
    const id = userData?.org_id?._id;
    if (id) {
      try {
        const params = `/${id}`;
        const response = await Service.makeAPICall({
          methodName: Service.getMethod,
          api_url: Service.getAdminSettings + params,
        });
        const org_favicon = response?.data?.data?.config?.adminSetting?.fav_icon;
        localStorage.setItem('FavIconURL', org_favicon)
        changeFavIcon()
      } catch (e) {
        console.log(e);
      }
    }
  }

  const changeFavIcon = () => {
    const favicon = document.getElementById("fav_icon");
    const FavIcon = localStorage.getItem('FavIconURL'); //retrive from redux store
    //favicon.setAttribute("href", "logo192.png"); 
    favicon.href = FavIcon;
  }

  if (!isUserTokenVerified && authUser) {
    return null;
  }
  return (<Route
    {...rest}
    render={props =>
      authUser && accessToken
        ? <Component {...props} />
        : <Redirect
          to={{
            pathname: '/signin',
            state: { from: location }
          }}
        />}
  />)
};

const AuthRoute = ({ component: Component, location, authUser, ...rest }) => {
  return (<Route
    {...rest}
    render={props =>
      !authUser
        ? <Component {...props} />
        : <Redirect
          to={{
            pathname: '/dashboard',
          }}
        />}
  />)
};


const App = (props) => {

  const dispatch = useDispatch();
  const { locale, themeType, navStyle, layoutType, themeColor } = useSelector(({ settings }) => settings);
  const { loader, alertMessage, showMessage, authUser, initURL } = useSelector(({ auth }) => auth);
  const location = useLocation();
  const history = useHistory();
  const match = useRouteMatch();

  useEffect(() => {
    let link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = `/css/${themeColor}.css`;  //This line is changed, this comment is for explaination purpose.

    link.className = 'gx-style';
    document.body.appendChild(link);
  }, []);


  useEffect(() => {
    if (initURL === '') {
      dispatch(setInitUrl(location.pathname));
    }
    const params = new URLSearchParams(location.search);

    if (params.has("theme")) {
      dispatch(setThemeType(params.get('theme')));
    }
    if (params.has("nav-style")) {
      dispatch(onNavStyleChange(params.get('nav-style')));
    }
    if (params.has("layout-type")) {
      dispatch(onLayoutTypeChange(params.get('layout-type')));
    }
    setLayoutType(layoutType);
    setNavStyle(navStyle);
  });


  const setLayoutType = (layoutType) => {
    if (layoutType === LAYOUT_TYPE_FULL) {
      document.body.classList.remove('boxed-layout');
      document.body.classList.remove('framed-layout');
      document.body.classList.add('full-layout');
    } else if (layoutType === LAYOUT_TYPE_BOXED) {
      document.body.classList.remove('full-layout');
      document.body.classList.remove('framed-layout');
      document.body.classList.add('boxed-layout');
    } else if (layoutType === LAYOUT_TYPE_FRAMED) {
      document.body.classList.remove('boxed-layout');
      document.body.classList.remove('full-layout');
      document.body.classList.add('framed-layout');
    }
  };

  const setNavStyle = (navStyle) => {
    if (navStyle === NAV_STYLE_DEFAULT_HORIZONTAL ||
      navStyle === NAV_STYLE_DARK_HORIZONTAL ||
      navStyle === NAV_STYLE_INSIDE_HEADER_HORIZONTAL ||
      navStyle === NAV_STYLE_ABOVE_HEADER ||
      navStyle === NAV_STYLE_BELOW_HEADER) {
      document.body.classList.add('full-scroll');
      document.body.classList.add('horizontal-layout');
    } else {
      document.body.classList.remove('full-scroll');
      document.body.classList.remove('horizontal-layout');
    }
  };

  useEffect(() => {
    if (location.pathname === '/') {
      if (authUser === null) {
        history.push('/signin');
      } else if (initURL === '' || initURL === '/' || initURL === '/signin') {
        history.push('/dashboard');
      } else {
        history.push(initURL);
      }
    }
  }, [authUser, initURL, location, history]);

  useEffect(() => {
    if (themeType === THEME_TYPE_DARK) {
      document.body.classList.add('dark-theme');
      document.body.classList.add('dark-theme');
      let link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = "/css/dark_theme.css";
      link.className = 'style_dark_theme';
      document.body.appendChild(link);
    }
  }, []);

  useEffect(() => {
    setSystemImages();
  }, [])

  const setSystemImages = async () => {
    try {
      const FavIcon = localStorage.getItem('FavIconURL');
      if (FavIcon) {
        const favicon = document.getElementById("fav_icon");
        favicon.href = FavIcon;
      } else {
        // const favicon = document.getElementById("fav_icon");
        // const file = ElsnerElevate;
        // const base64 = await convertBase64(file);
        // localStorage.setItem('FavIconURL', base64);
        // favicon.href = FavIcon;
      }
    } catch (e) {
      console.log(e);
    }
  }

  const currentAppLocale = AppLocale[locale.locale];

  return (
    <ConfigProvider locale={currentAppLocale.antd}>
      <IntlProvider
        locale={currentAppLocale.locale}
        messages={currentAppLocale.messages}>
        <Suspense fallback={<div className="gx-loader-view"><CircularProgress /></div>}>
          {loader ? (
            <div className="gx-loader-view"><CircularProgress /></div>
          ) : null}
          {showMessage ? message.error(alertMessage.toString()) : null}
          <Switch>
            <AuthRoute path={`${match.url}signin`} authUser={authUser} location={location}
              component={SignIn} />
            <AuthRoute path={`${match.url}forgot-password`} component={ForgotPassword} />
            <AuthRoute path={`${match.url}reset-password/:token`} component={ResetPassword} />
            <RestrictedRoute path={`${match.url}`} authUser={authUser} location={location}
              component={MainApp} />
          </Switch>
        </Suspense>
      </IntlProvider>
    </ConfigProvider>
  )
};

export default memo(App);

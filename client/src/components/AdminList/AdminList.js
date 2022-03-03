import React, { useState, useEffect } from "react";
import { setLogo } from "../../appRedux/actions/Common";
import { useDispatch, useSelector } from 'react-redux';
import { Card, Table, Button, Input, Upload, Switch, message } from "antd";
// import ElsnerIcon from "../../assets/images/Favicon_EEMS.png";
// import ElsnerElevate from "../../assets/images/ElsnerElevate.svg";
import { Link } from 'react-router-dom'
import Service from '../../service';
// import {
//   showAuthLoader,
//   hideAuthLoader,
// } from "../../appRedux/actions/Auth";
const Search = Input.Search;

const AdminList = () => {
  const dispatch = useDispatch();
  const [Admilist, setAdminlist] = useState([])
  const [adminImage, setAdminImages] = useState(null)
  const [toggle, setToggle] = useState(false);
  const { authUser } = useSelector(
    ({ auth }) => auth
  );
  const [logoFileList, setlogoFileList] = useState([]);
  const [faviconFileList, setfaviconFileList] = useState([]);
  const [q, setQ] = useState("")
  useEffect(() => {
    getAdminList();
    getAdminListLogo();
  }, []);
  const id = authUser._id;

  const getAdminList = async () => {
    try {
      // dispatch(showAuthLoader());
      const params = `/${authUser?.org_id?._id}`;
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.getAdminList + params,
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        setAdminlist(response.data.data)
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };


  const getAdminListLogo = async () => {
    try {
      // dispatch(showAuthLoader());
      const params = `/${authUser?.org_id?._id}`;
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.adminSetting + params,
      });
      // dispatch(hideAuthLoader());
      if (response.data) {
        setAdminImages(response.data.data.config.adminSetting)
        if (response.data.data?.config?.adminSetting?.fav_icon) {

          const favfile = {
            uid: Service.uuidv4(),
            name: response.data.data.config.adminSetting.fav_icon,
            status: 'done',
            url: response.data.data.config.adminSetting.fav_icon
          };
          faviconFileList.push(favfile);
          setfaviconFileList([...faviconFileList]);
        }
        if (response.data.data?.config?.adminSetting?.logo) {
          const logofile = {
            uid: Service.uuidv4(),
            name: response.data.data.config.adminSetting.logo,
            status: 'done',
            url: response.data.data?.config?.adminSetting?.logo
          };
          logoFileList.push(logofile);
          setlogoFileList([...logoFileList]);
        }
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  const uploadFavIcon = async ({ file, onSuccess, onError }) => {
    try {
      // dispatch(showAuthLoader());
      const base64 = await convertBase64(file);
      localStorage.setItem('FavIconURL', base64) //set in redux store
      //dispatch(setFavIcon(base64));
      const id = authUser?.org_id?._id;
      const params = `/${id}`;
      await Service.makeAPICall({
        methodName: Service.putMethod,
        api_url: Service.editLogo_Icon + params,
        body: {
          logo: adminImage.logo,
          fav_icon: base64,
          org_id: authUser?.org_id._id,
          user_id: authUser?._id,
        }
      });
      changeFavIcon();//set
      setAdminImages({
        ...adminImage,
        fav_icon: base64,
      })
    }
    catch (e) {
      // dispatch(hideAuthLoader());
      onError(e);
    }
  }

  const uploadLogo = async ({ file, onSuccess, onError }) => {
    try {
      // dispatch(showAuthLoader());
      const base64 = await convertBase64(file);
      localStorage.setItem('LogoURL', base64)
      dispatch(setLogo(base64));
      const id = authUser?.org_id?._id;
      const params = `/${id}`;
      await Service.makeAPICall({
        methodName: Service.putMethod,
        api_url: Service.editLogo_Icon + params,
        body: {
          fav_icon: adminImage.fav_icon,
          logo: base64,
          org_id: authUser?.org_id._id,
          user_id: authUser?._id,
        }
      });
      setAdminImages({
        ...adminImage,
        logo: base64,
      });
    } catch (e) {
      // dispatch(hideAuthLoader());
      onError(e)
    }
  }

  const setSiteStatus = async (checked) => {
    try {
      //dispatch(showAuthLoader());
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.putMethod,
        api_url: Service.customadminSetting + params,
        body: {
          custom: { showGoogleSignIn: checked },
          user_id: authUser._id,
          org_id: authUser?.org_id._id,

        },
      });
      //dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        console.log("response.data.data data", response.data.data);

      }
    } catch (error) {
      //dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      //setPreviousImage(fileReader);
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
      fileReader.readAsDataURL(file);
    });
  }

  const changeFavIcon = () => {
    const favicon = document.getElementById("fav_icon");
    const FavIcon = localStorage.getItem('FavIconURL'); //retrive from redux store
    //favicon.setAttribute("href", "logo192.png"); 
    favicon.href = FavIcon;
  }
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record, index) => {
        if (record?.first_name && record?.last_name) {
          return (
            <span>
              {record?.first_name + " " + record?.last_name}
            </span>
          );
        } else {
          return null;
        }
      },
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'PhoneNumber',
      dataIndex: 'phone_number',
      key: 'phone_number',
    },
    {
      title: 'Role',
      dataIndex: 'role_name',
      key: 'role',

      render: (text, record, index) => (
        <span>{record.role_id?.role_name}</span>
      ),
    }
  ];

  if (!adminImage) {
    return null
  }

  const handleChangeFav = (info) => {
    if (info.file.status === "uploading") {
      info.file.status = "done";
    }
    if (info.file.status === "done") {
      setfaviconFileList(info.fileList);
    }
  };

  const handleChangeLogo = (info) => {
    if (info.file.status === "uploading") {
      info.file.status = "done";
    }
    if (info.file.status === "done") {
      setlogoFileList(info.fileList);
    }
  };

  const onRemovefav = (file) => {
    const index = faviconFileList.indexOf(file);
    faviconFileList.splice(index, 1);
    setfaviconFileList([...faviconFileList]);
  }

  const onRemovelogo = (file) => {
    const index = logoFileList.indexOf(file);
    logoFileList.splice(index, 1);
    setlogoFileList([...logoFileList]);
  }
  //   const [q, setQ] = useState("");

  const search = (rows) => {
    const columns = rows[0] && Object.keys(rows[0]);
    return rows.filter((row) =>
      columns.some(
        (column) =>
          row[column]?.toString().toLowerCase().indexOf(q.toLowerCase()) > -1
      )
    );
  };

  return (
    <>
      <Card title="Admin List">
        <Search
          placeholder="Search"
          style={{ width: 200 }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Link to="/add-admin"> <Button type="primary" style={{ float: "right" }}>Add Admin</Button></Link>

        <Switch defaultChecked onChange={setSiteStatus} />
        <Table className="gx-table-responsive" columns={columns} dataSource={search(Admilist)} />
      </Card>

      <Card title="Image upload">
        Fav-Icon
        <Upload
          name="favicon_url"
          listType='picture-card'
          maxCount={1}
          fileList={faviconFileList}
          onChange={handleChangeFav}
          onRemove={onRemovefav}
          customRequest={(e) => uploadFavIcon(e)}
          onPreview={false}

        >
          {faviconFileList.length < 1 && "+ Upload"}
        </Upload>

        Logo
        <Upload
          name="logo_url"
          listType='picture-card'
          maxCount={1}
          fileList={logoFileList}
          onChange={handleChangeLogo}
          onRemove={onRemovelogo}
          customRequest={(e) => uploadLogo(e)}
        >
          {logoFileList.length < 1 && "+ Upload"}
        </Upload>


      </Card>
    </>
  );
};

export default AdminList;

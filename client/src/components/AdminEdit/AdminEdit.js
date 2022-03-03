import React, { useState, useEffect } from "react";
import { Input, Button, Form, Card, Upload, message } from "antd";
import { useDispatch, useSelector } from 'react-redux';
import Service from "../../service";
import {
  showAuthLoader,
  hideAuthLoader,
} from "../../appRedux/actions/Auth";
import imageCompression from "browser-image-compression";

const AdminEdit = (props) => {

  const [adminData, setAdminData] = useState(null);
  const dispatch = useDispatch();
  const { authUser } = useSelector(
    ({ auth }) => auth
  ); const [imageUrlArr, setImageUrlArr] = useState([]);
  const [fileList, setFileList] = useState([]);
  const id = authUser._id;

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 8 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 16 },
    },
  };

  const tailFormItemLayout = {
    wrapperCol: {
      xs: {
        span: 24,
        offset: 0,
      },
      sm: {
        span: 16,
        offset: 8,
      },
    },
  };
  useEffect(() => {
    getAdminData();
  }, []);

  const getAdminData = async () => {
    try {
      dispatch(showAuthLoader());
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.userById + params,
      });
      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        setAdminData(response.data.data);
        if (response.data.data.user_img && response.data.data.user_img.length > 0) {
          let url;
          if (response.data.data.user_img.includes('base64')) {
            url = response.data.data.user_img;
          } else {
            url = `${Service.Server_Base_URL}/uploads/user_images/${response.data.data.user_img}`
          }
          const file = {
            uid: Service.uuidv4(),
            name: response.data.data.user_img,
            status: 'done',
            url
          };
          fileList.push(file);
          setFileList([...fileList]);
        }
      }
    } catch (error) {
      dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  const onCancel = () => {
    props.history.push('/dasboard');
  };
  const handleUpdate = async (values) => {
    try {
      if (fileList.length === 0) {
        const msg = "Please provide at least one image";
        const index = Service.add_message(msg);
        if (index === -1) {
          message.error(msg).then(() => {
            Service.remove_message(msg);
          });
        }
        return;
      }
      const reqBody = {
        ...values,
        user_id: authUser?._id,
      };
      const formData = new FormData();

      if (imageUrlArr && imageUrlArr.length > 0) {
        reqBody.user_img = imageUrlArr[0].compressedFile;
      } for (var key in reqBody) {
        if (reqBody[key] && Array.isArray(reqBody[key])) {
          formData.append(`${key}[]`, reqBody[key]);
        } else {
          formData.append(key, reqBody[key]);
        }
      }
      const params = `/${id}`;
      dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.putMethod,
        api_url: Service.editAdmin + params,
        body: formData
      });
      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        props.history.push("/dashboard");
        message.success(response.data.message)
      }
      else {
        message.error(response.data.message)

      }
    } catch (error) {
      dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const getCompressedFile = async (imageFile) => {
    const options = {
      maxSizeMB: 5,
      useWebWorker: true,
    };
    console.log(`originalFile size ${imageFile.size / 1024 / 1024} MB`);
    const compressedFile = await imageCompression(imageFile, options);
    console.log(`compressedFile size ${compressedFile.size / 1024 / 1024} MB`);
    // const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);
    return (compressedFile)
  };

  const beforeUpload = (file) => {
    const isJpgOrPng =
      file.type === "image/jpg" ||
      file.type === "image/jpeg" ||
      file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
    }
    const isLtM = file.size / 1024 / 1024 < 10;
    if (!isLtM) {
      message.error("Image must smaller than 10MB!");
    }
    return isJpgOrPng;
  };
  const handleChange = (info) => {
    if (info.file.status === "uploading") {
      info.file.status = "done";
    }
    if (info.file.status === "done") {
      setFileList(info.fileList);
    }
  };

  const uploaderProps = {
    name: "file",
    listType: "picture-card",
    accept: "image/*",
    maxCount: 1,
    fileList: fileList,
    beforeUpload: beforeUpload,
    onChange: handleChange,
    customRequest: async ({ onSuccess, onError, file }) => {
      const compressedFile = await getCompressedFile(file);
      imageUrlArr.push({
        file,
        compressedFile: compressedFile,
      });
      setImageUrlArr([...imageUrlArr]);
      onSuccess("ok");
    },
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const index_2 = imageUrlArr.findIndex(
        (item) => item.file?.uid === file.uid || item.uid === file.uid
      );
      if (index_2 > -1) {
        imageUrlArr.splice(index_2, 1);
        setImageUrlArr([...imageUrlArr]);
      }
      fileList.splice(index, 1);
      setFileList([...fileList]);
    },
  };
  const uploadButton = (
    <Upload {...uploaderProps}>
      {fileList.length < uploaderProps.maxCount && "+ Upload"}
    </Upload>
  );
  const validator = (rule, value) => {
    if (rule.field === 'first_name') {
      if (value && !/^[^-\s][a-zA-Z0-9_\s-]+$/.test(value)) {
        return Promise.reject('Please enter valid First Name!');
      } else {
        return Promise.resolve();
      }
    } else if (rule.field === 'last_name') {
      // if (value && !/^([ A-Za-z0-9]{3,16})$/.test(value)) {
      if (value && !/^[^-\s][a-zA-Z0-9_\s-]+$/.test(value)) {
        return Promise.reject('Please enter valid Last Name!');
      } else {
        return Promise.resolve();
      }
    }
    else if (rule.field === 'phone_number') {
      if (value && ! /^(\+\d{1,3}[- ]?)?\d{10}$/.test(value)) {
        return Promise.reject('Please enter valid Phone Number!');
      } else {
        return Promise.resolve();
      }
    }

    else {
      return Promise.resolve();
    }
  }
  if (!adminData) {
    return null;
  }

  return (
    <>
      <Card className="gx-card" title="Edit Profile">
        <Form
          layout="vertical"
          {...formItemLayout}
          onFinish={handleUpdate}
          initialValues={adminData}
        >
          <Form.Item
            label="First Name"
            name="first_name"
            rules={[
              {
                required: true,
                message: "Please enter your First name!",
              },
              { validator: validator }

            ]}
          >
            <Input size="large" type="text" />
          </Form.Item>
          <Form.Item
            label="Last Name"
            name="last_name"
            rules={[
              {
                required: true,
                message: "Please enter your Last name!",
              },
              { validator: validator }

            ]}
          >
            <Input size="large" type="text" />
          </Form.Item>
          <Form.Item
            label="Phone Number"
            name="phone_number"
            rules={[
              {
                required: true,
                message: "Please enter Phone Number!",
              },
              { validator: validator }

            ]}
          >
            <Input size="large" type="text" />
          </Form.Item>
          <Form.Item label="Photo">{uploadButton}</Form.Item>

          <Form.Item {...tailFormItemLayout}>
            <Button id="addbutton" type="primary" htmlType="submit">
              Submit
            </Button>
            <Button type="primary" onClick={onCancel}>
              Back
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
};

export default AdminEdit;

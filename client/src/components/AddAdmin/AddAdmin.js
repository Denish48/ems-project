import React, { useEffect, useState } from "react";
import { Card, Form, Select, Button, Input, message, Upload } from "antd";
import { useSelector } from 'react-redux';
import Service from "../../service";
import imageCompression from "browser-image-compression";

const { Option } = Select;

const AddAdmin = (props) => {
  const [Role, setRole] = useState([]);
  const [imageUrlArr, setImageUrlArr] = useState([]);
  const [fileList, setFileList] = useState([]);
  const { authUser } = useSelector(
    ({ auth }) => auth
  );


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
    getRole()
  }, [])
  const onCancel = () => {
    if (props.history.length > 1) {
      props.history.goBack();
    } else {
      props.history.push('/setting');
    }
  };
  const onFinish = async (values) => {
    try {
      // dispatch(showAuthLoader());
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
      const formData = new FormData();
      const reqBody = {
        ...values,
        org_id: authUser?.org_id._id,
        user_id: authUser?._id,
        role_id: authUser?.role_id._id,

      };
      if (imageUrlArr && imageUrlArr.length > 0) {
        const user_image_arr = imageUrlArr.map((item) => item.compressedFile);
        formData.append('user_img', user_image_arr[0]);
      }
      for (var key in reqBody) {
        if (reqBody[key] && Array.isArray(reqBody[key])) {
          formData.append(`${key}[]`, reqBody[key]);
        } else {
          formData.append(key, reqBody[key]);
        }
      }
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.addAdminUser,
        body: formData
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        props.history.push("/admin-list");
        message.success(response.data.message);
      }
      else {
        message.error(response.data.message);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());

      console.log(error);
    }
  };
  const validator = (rule, value) => {
    if (rule.field === 'first_name') {
      if (value && !/^[^-\s][a-zA-Z0-9_\s-]+$/.test(value)) {
        return Promise.reject('Please enter valid first name!');
      } else {
        return Promise.resolve();
      }
    } else if (rule.field === 'last_name') {
      if (value && !/^([ A-Za-z0-9]{3,16})$/.test(value)) {
        return Promise.reject('Please enter valid lastname!');
      } else {
        return Promise.resolve();
      }
    }
    else if (rule.field === 'email') {
      if (value && !/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value)) {
        return Promise.reject('Please enter valid email!');
      } else {
        return Promise.resolve();
      }
    }
    else if (rule.field === 'phone_number') {
      if (value && ! /^[0-9]+$/.test(value)) {
        return Promise.reject('Please enter valid Phone number!');
      } else {
        return Promise.resolve();
      }
    }

    else {
      return Promise.resolve();
    }
  }

  const getCompressedFile = async (imageFile) => {
    const options = {
      maxSizeMB: 5,
      useWebWorker: true,
    };
    console.log(`originalFile size ${imageFile.size / 1024 / 1024} MB`);
    const compressedFile = await imageCompression(imageFile, options);
    return compressedFile;
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
  const handleChange = async (info) => {
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

  const getRole = async (values) => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.rolesDropdownList,
      });
      if (response.data && response.data.data) {
        setRole(response.data.data);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  return (
    <Card className="gx-card" title="Admin Add">
      <Form layout="vertical"
        {...formItemLayout}
        onFinish={onFinish}
      >
        <Form.Item
          label=" First Name"
          name="first_name"
          rules={[
            {
              required: true,
              message: "Please enter your First Name",
            },
            { validator: validator }

          ]}
        >
          <Input size="large" />
        </Form.Item>
        <Form.Item
          label=" Last Name"
          name="last_name"
          rules={[
            {
              required: true,
              message: "Please enter your Last Name",
            },
            { validator: validator }
          ]}
        >
          <Input size="large" />
        </Form.Item>
        <Form.Item
          label=" Email"
          name="email"
          rules={[
            {
              required: true,
              message: "Please enter your Email Address",
            },
            {
              type: "email",
              message: 'Please enter valid Email Address',
            }
          ]}
        >
          <Input size="large" />
        </Form.Item>
        {/* <Form.Item
          lable="Password"
          name="password"

          rules={[
            {
              required: true,
              message: 'Please input your password!',
            },
            {
              type: "password",
              // message: 'Please enter valid Email Address',
            }
          ]}
        >
          <Input size="large" />

        </Form.Item> */}
        <Form.Item
          label=" Password"
          name="password"
          rules={[
            {
              required: true,
              message: "Please enter your password",
            },
          ]}
        >
          <Input size="large" type="password" />
        </Form.Item>

        <Form.Item
          label=" Role"
          name="role_id"
          rules={[
            {
              required: true,
              message: "Please input your Admin Role!",
            },
          ]}
        >
          <Select size="large">
            {Role.map((item, index) => (
              <Option key={index} value={item._id}>
                {item.role_name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="Contact Info"
          name="phone_number"
          rules={[
            {
              required: true,
              message: "Please enter your Contact Info!",
            },
            { validator: validator }

          ]}
        >
          <Input size="large" />
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
  );
};

export default AddAdmin;

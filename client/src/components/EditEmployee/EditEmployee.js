import React, { useState, useEffect } from "react";
import { Card, Form, Button, Input, Select, message, Upload, DatePicker } from "antd";
import { useSelector } from 'react-redux';
import Service from "../../service";
import moment from "moment";
import imageCompression from "browser-image-compression";

const { Option } = Select;

const EditEmployee = (props) => {
  const [empApiData, setEmpApiData] = useState(null);
  const [departmentList, setDepartmentList] = useState([]);
  const [imageUrlArr, setImageUrlArr] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [positionlist, setpositionList] = useState([]);

  const id = props.match.params.id;
  const [form] = Form.useForm();
  const { authUser } = useSelector(
    ({ auth }) => auth
  );

  useEffect(() => {
    getEmployeeById();
    getDepartmentList();
    getpositionDropdownList()

  }, []);

  const getEmployeeById = async () => {
    try {
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.employeebyId + params,

      });
      if (response.data && response.data.data) {
        setEmpApiData(response.data.data);
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
      console.log(error);
    }
  };


  const getDepartmentList = async (values) => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.departmentDropdownList,
      });
      if (response.data && response.data.data) {
        setDepartmentList(response.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getpositionDropdownList = async () => {
    try {
      // dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.designationDropdownList,
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        console.log("response.data.data position", response.data.data);
        setpositionList(response.data.data);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
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

  const handleUpdate = async (values) => {

    try {
      if (fileList.length === 0) {
        return message.error("Please provide at least one image");
      }
      const formData = new FormData();
      const reqBody = {
        ...values,
        user_id: authUser?._id,
      };
      if (imageUrlArr && imageUrlArr.length > 0) {
        formData.append('user_img', imageUrlArr[0].compressedFile);
      }
      for (var key in reqBody) {
        if (reqBody[key] && Array.isArray(reqBody[key])) {
          formData.append(`${key}[]`, reqBody[key]);
        } else {
          formData.append(key, reqBody[key]);
        }
      }
      // formData.forEach((value, key) => {
      //   console.log(key, value);
      // });
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.putMethod,
        api_url: Service.editEmployee + params,
        body: formData
      });
      if (response.data && response.data.data) {
        props.history.push("/employee");
        message.success(response.data.message)
      }
      else {
        message.error(response.data.message)

      }
    } catch (error) {
      console.log(error);
    }
  };
  const onCancel = () => {
    if (props.history.length > 1) {
      props.history.goBack();
    } else {
      props.history.push('/employee');
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
      if (value && !/^[^-\s][a-zA-Z0-9_\s-]+$/.test(value)) {
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
      if (value && ! /^(\+\d{1,3}[- ]?)?\d{10}$/.test(value)) {
        return Promise.reject('Please enter valid Phone number!');
      } else {
        return Promise.resolve();
      }
    }

    else {
      return Promise.resolve();
    }
  }

  const disabledDate = (current) => {
    return current.isAfter(moment());
  };

  if (!empApiData) {
    return <></>;
  }

  const getCompressedFile = async (imageFile) => {
    const options = {
      maxSizeMB: 5,
      useWebWorker: true,
    };
    console.log(`originalFile size ${imageFile.size / 1024 / 1024} MB`);
    const compressedFile = await imageCompression(imageFile, options);
    console.log(`compressedFile size ${compressedFile.size / 1024 / 1024} MB`);
    // const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);
    return (compressedFile);
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
  function onChange(date, dateString) {
    console.log(date, dateString);
  }
  console.log("empApiData", empApiData);
  const birthdateEmp = new Date(empApiData?.birthdate)
  console.log("birthdateEmp", birthdateEmp);
  const datestring = birthdateEmp.getDate() + '-' + (birthdateEmp.getMonth() + 1) + '-' + birthdateEmp.getFullYear()
  const worker = moment(datestring)
  console.log("worker", worker._i);
  const dateFormat = 'YYYY/MM/DD';
  // console.log("datestring", datestring);
  // var date_start = moment(empApiData?.birthdate).utc().format("YYYY MM DD");
  // console.log("date_start", date_start);
  return (
    <Card className="gx-card" title="Edit Employee">
      <Form
        layout="vertical"
        {...formItemLayout}
        form={form}
        onFinish={handleUpdate}
        initialValues={{
          ...empApiData,
          department_id: empApiData?.department_id?._id,
          birthdate: moment(empApiData?.birthdate)
        }}
      >
        <Form.Item
          label="Employee First Name"
          name="first_name"
          rules={[
            {
              required: true,
              message: "Please enter your First Name",
            },
          ]}
        >
          <Input size="large" />
        </Form.Item>
        <Form.Item
          label="Employee Last Name"
          name="last_name"
          rules={[
            {
              required: true,
              message: "Please enter your Last Name",
            },
          ]}
        >
          <Input size="large" />
        </Form.Item>
        <Form.Item
          label="Employee Email"
          name="email"
          rules={[
            {
              required: true,
              message: "Please enter your Email",
            },
            { validator: validator }

          ]}
        >
          <Input size="large" />
        </Form.Item>
        <Form.Item
          label="Employee Birth-Date"
          name="birthdate"
          rules={[
            {
              required: true,
              message: "Please enter your Employee Birth-Date",
            },
          ]}
        >
          <DatePicker  disabledDate={disabledDate}/>
        </Form.Item>

        <Form.Item
          label="Department"
          name="department_id"
          rules={[
            {
              required: true,
              message: "Please enter your DepartMent!",
            },
          ]}
        >
         <Select
            size="large"
            showSearch
            // optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            filterSort={(optionA, optionB) =>
              optionA.children
                .toLowerCase()
                .localeCompare(optionB.children.toLowerCase())
            }
          // getFieldValue
          >
            {departmentList.map((item, index) => (
              <Option key={index} value={item._id} style={{ textTransform: "capitalize" }}>
                {item.department_name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="Contact Number"
          name="phone_number"
          rules={[
            {
              required: true,
              message: "Please enter your Contact Number!",
            },
            { validator: validator }

          ]}
        >
          <Input size="large" />
        </Form.Item>
        <Form.Item
          label="Designation"
          name="designation_id"
          rules={[
            {
              required: true,
              message: "Please enter your designation!",
            },
          ]}
        >
          <Select
            size="large"
            showSearch
            // optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            filterSort={(optionA, optionB) =>
              optionA.children
                .toLowerCase()
                .localeCompare(optionB.children.toLowerCase())
            }
          // getFieldValue
          >
            {/* <Option key="all" value="all">ALL</Option> */}

            {positionlist.map((item, index) => (
              <>
                <Option key={index} value={item._id} style={{ textTransform: "capitalize" }}>
                  {item.designation_name}
                </Option>

              </>
            ))}
            {/* {children} */}
          </Select>
        </Form.Item>

        <Form.Item label="Photo" required={true}>{uploadButton}</Form.Item>

        <Form.Item {...tailFormItemLayout}>
          <Button id="addbutton" type="primary" htmlType="submit">
            Update
          </Button>
          <Button type="primary" onClick={onCancel} style={{ marginLeft: '10px' }}>
            Back
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EditEmployee;

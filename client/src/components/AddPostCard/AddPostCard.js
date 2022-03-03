import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Card,
  message,
  Select,
  DatePicker,
  Modal,
} from "antd";
import Service from "../../service";
import { useDispatch, useSelector } from "react-redux";
import {
  // showAuthLoader,
  hideAuthLoader,
} from "../../appRedux/actions/Auth";


const { Option } = Select;

const AddPostCard = (props) => {
  const [form] = Form.useForm();
  const [employeeList, setEmployeeList] = useState([]);
  const [postList, setpostList] = useState([]);
  const [IsModalView, setIsModalView] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const dispatch = useDispatch();
  const { authUser } = useSelector(({ auth }) => auth);
  const [formButton, setFormButton] = useState(0)


  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
    },
    sm: { span: 8 },
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
    getEmployeeList();
  }, []);
  const getEmployeeList = async () => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.employeesDropdownList,
      });
      if (response.data && response.data.data) {
        setEmployeeList(response.data.data);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  useEffect(() => {
    getPostList();
  }, []);

  const getPostList = async () => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.postCardTempleteList,
      });
      if (response.data && response.data.data) {
        let apiData = response.data.data
        let arr = []
        for (const data of apiData) {
          if (data.templete_name != 'Birthday') {
            arr.push(data)
          }
        }
        if (arr != []) {
          setpostList(arr);
        }
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  const onFinish = async (values) => {

    try {
      // dispatch(showAuthLoader());
      if (formButton === 1) {
        const { SelectDate, selectTemplate, selectUser } = values;
        const body = {
          post_date: SelectDate,
          user_id: selectUser,
          postCard_templete_id: selectTemplate,
          org_id: authUser?.org_id?._id,
          // user_id: authUser?._id,
        }
        const response = await Service.makeAPICall({
          methodName: Service.postMethod,
          api_url: Service.addpostcard,
          body,
        });
        // dispatch(hideAuthLoader());
        if (response.data && response.data.data) {
          message.success(response.data.message);
          onCancel();
        } else {
          message.error(response.data.message);
        }
      }
      if (formButton === 2) {

        const fieldVal = form.getFieldValue();
        const body = {
          user_id: fieldVal.selectUser,
          postCard_templete_id: fieldVal.selectTemplate
        }
        const response = await Service.makeAPICall({
          methodName: Service.postMethod,
          api_url: Service.previewtemplete,
          body,
        });
        if (response.data) {
          setSelectedTemplate(response.data)
          setIsModalView(true)
        }
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  const onCancel = () => {
    if (props.history.length > 1) {
      props.history.goBack();
    } else {
      props.history.push("/birthday");
    }
  };

  const onReset = () => {
    form.resetFields();
    setSelectedTemplate(null)

  };

  function onChange(date, dateString) {
  }
  const closeEventModalView = () => {
    setIsModalView(!IsModalView);
    setSelectedTemplate(null)
  };

  return (
    <>
      <Card className="gx-card" title="Add Achievement">
        <Form
          layout="vertical"
          onFinish={onFinish}
          form={form}
          {...formItemLayout}
        >
          <Form.Item
            label="Select Achievement Date"
            name="SelectDate"
            rules={[
              {
                required: true,
                message: 'Please Select Date',
              }
            ]}
          >
            <DatePicker
              onChange={onChange}
              disabledDate={(current) => {
                let date = new Date()
                return current && current < new Date(date.getFullYear(), date.getMonth(), date.getDate())
              }}
            />
          </Form.Item>
          <Form.Item
            label="Select Achievement User"
            name="selectUser"
            rules={[
              {
                required: true,
                message: 'Please Select User',
              }
            ]}
          >
            <Select
              size="large"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              filterSort={(optionA, optionB) =>
                optionA.children
                  .toLowerCase()
                  .localeCompare(optionB.children.toLowerCase())
              }
            >
              {employeeList.map((item, index) => (
                <Option
                  key={index}
                  value={item._id}
                  style={{ textTransform: "capitalize" }}
                >
                  {item.first_name + " " + item.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Select Achievement Template"
            name="selectTemplate"
            rules={[
              {
                required: true,
                message: 'Please Select Template',
              }
            ]}
          >
            <Select
              size="large"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              filterSort={(optionA, optionB) =>
                optionA.children
                  .toLowerCase()
                  .localeCompare(optionB.children.toLowerCase())
              }
            >
              {postList.map((item, index) => (
                <Option
                  key={index}
                  value={item._id}
                  style={{ textTransform: "capitalize" }}
                >
                  {item.templete_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item {...tailFormItemLayout}>
            <Button type="primary"
              onClick={() => setFormButton(1)}
              htmlType="submit">
              Submit
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              onClick={() => setFormButton(2)}
              // onClick={() => {
              //   
              //   Preview();
              // }}
              style={{ marginLeft: "10px" }}
            >
              Preview
            </Button>
            <Button type="primary" onClick={onReset} style={{ marginLeft: "10px" }}>
              Reset
            </Button>
            <Button
              type="primary"
              onClick={onCancel}
              style={{ marginLeft: "10px" }}
            >
              Cancel
            </Button>

          </Form.Item>
        </Form>
        <Modal
          // title="Template Preview"
          visible={IsModalView}
          width={1100}

          // style={{width:1000,height:1000}}
          okText="Update"
          footer={false}
          onCancel={() => closeEventModalView()}
        >
          {selectedTemplate && selectedTemplate.length > 0 ? <div dangerouslySetInnerHTML={{ __html: selectedTemplate }} /> : null}
        </Modal>
      </Card>
    </>
  );
};

export default AddPostCard;

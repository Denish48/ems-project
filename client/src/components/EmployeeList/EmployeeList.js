import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Input,
  Table,
  Modal,
  Button,
  Select,
  Form,
  Col,
  Card,
  Avatar,
  Row,
  Radio,
  Space,
  Tag,
  message,
} from "antd";
import { DownloadOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Service from "../../service";
import "./employeeList.css";
import {
  hideAuthLoader,
} from "../../appRedux/actions/Auth";

import { CSVLink, } from "react-csv";
// import moduleName from '../../user.csv'
const { Option } = Select;
const Search = Input.Search;

const EmployeeList = () => {
  const [eventType, setEventType] = React.useState(null);
  const [IsModalView, setIsModalView] = useState(false);
  const [form] = Form.useForm();
  const [deptData, setDeptData] = useState([]);
  let [filterData, setFilterData] = useState(null);
  const [eventEmpData, setEmpData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [seachEnabled, setSearchEnabled] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [eventTypeApiData, setEventTypeApiData] = useState([]);
  const [eventTypeName, setEventTypeName] = useState()
  const searchRef = useRef();
  const importRef = useRef(null)
  // const employees = useSelector((state) => state.employee);
  const dispatch = useDispatch();
  const { authUser } = useSelector(
    ({ auth }) => auth
  );

  const openEventModalView = () => {
    // setEvent_record(record);
    setIsModalView(true);
  };
  // const onChangeRange = (e) => {
  //   setRadioV(e.target.value);
  // };
  const closeEventModalView = () => {
    // setEvent_record(record);
    form.resetFields();
    setIsModalView(!IsModalView);
    setFilterData([]);
  };


  // const handleCancel = useCallback(() => {
  //   form.resetFields();
  //   setIsModalVisible(false);
  //   setIsModalView(false);
  // }, [form]);

  useEffect(() => {
    getEmployee();
    getDepartmentList();
    getEventType();
  }, [filterData, searchText, pagination.current, pagination.pageSize]);

  const getEmployee = useCallback(async () => {
    try {
      const reqBody = {
        pageNum: pagination.current,
        pageLimit: pagination.pageSize,
      };
      if (searchText && searchText !== "") {
        reqBody.search = searchText;
        setSearchEnabled(true);
      }
      if (filterData) {
        if (filterData.departments?.length > 0) {
          reqBody.department_id = filterData.departments;
        }
        if (typeof filterData.event_types) {
          // console.log(filterData.event_types);
          reqBody.event_types = filterData.event_types;
        }
      }

      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.employees,
        body: reqBody,
      });
      if (response?.data?.data?.length > 0) {
        setPagination({
          ...pagination,
          total: response.data.metaData.totalFilteredCount,
        });
        const employee = response.data.data;
        setEmpData([]);
        setEmpData(employee);

      } else {
        setPagination({
          ...pagination,
          total: 0,
        });
        setEmpData([]);
        message.error(response.data.message)
      }
    } catch (error) {
      console.log(error);
    }
  }, [filterData, searchText, pagination.current, pagination.pageSize]);

  const filterEmp = async (values) => {
    setFilterData(values);
    setIsModalView(!IsModalView);
  };

  const readExcel = async (file) => {
    try {

      // dispatch(showAuthLoader());
      const data = new FormData();
      data.append('attachment', file);
      data.append("org_id", authUser.org_id?._id);
      data.append("user_id", authUser._id);

      const options = {
        'content-type': 'multipart/form-data'
      }
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.importUsers,
        body: data,
        options
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.status === 200) {
        getEmployee();
        message.success(response.data.message)
      } else {
        message.error(response.data.message)
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const exportCsv = async () => {
    try {
      // dispatch(showAuthLoader());
      const org_id = authUser.org_id?._id
      const params = `/${org_id}`;
      // window.open('' + Service.exportemployees + params, "_blank");
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.exportUsers + params,
      });
      // dispatch(hideAuthLoader());
      if (response?.data?.data && response.data.status === 200) {
        let base64 = response.data.data;
        // var blob = new Blob([base64], { type: "data:application/octet-stream;base64" });
        // const linkSource = window.URL.createObjectURL(blob);
        const linkSource = 'data:text/csv;base64,' + base64;
        const downloadLink = document.createElement("a");
        const fileName = "Emplyoees.csv";

        downloadLink.href = linkSource;
        downloadLink.download = fileName;
        downloadLink.style.display = 'none';
        downloadLink.click();
        downloadLink.remove();
        message.success(response.data.message)
      }
      else {
        message.error(response.data.message)

      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  }
  const actionEmp = async (id, index) => {
    try {
      // dispatch(showAuthLoader());
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.employeeAccountAction + params,
        body: {
          emp_id: authUser.emp_id,
          user_id: authUser._id
        }
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.userData) {
        eventEmpData[index] = {
          ...eventEmpData[index],
          isDeleted: !eventEmpData[index].isDeleted
        };
        message.success(response.data.message)
        const newEmp = eventEmpData;
        setEmpData([]);
        setEmpData(newEmp);
      }
      else {
        message.error(response.data.message)
      }
    } catch (error) {
      dispatch(hideAuthLoader());
      console.log(error);
    }
  }
  const resetSearchFilter = (e) => {
    const keyCode = e && e.keyCode ? e.keyCode : e;
    switch (keyCode) {
      case 8:
        if (searchRef.current.state?.value?.length <= 1 && seachEnabled) {
          searchRef.current.state.value = '';
          setSearchText('');
          setSearchEnabled(false);
        }
        break;
      case 46:
        if (searchRef.current.state?.value?.length <= 1 && seachEnabled) {
          searchRef.current.state.value = '';
          setSearchText('');
          setSearchEnabled(false);
        }
        break;
      default:
        break;
    }
  }
  const onSearch = (value) => {
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
  };
  const columns = [
    {
      title: "Avatar",
      dataIndex: "first_name",
      key: "name",
      render: (text, record) => {
        var getInitials = function (string) {
          if (string.search(" ")) {
            var names = string.split(" "),
              initials = names[0].substring(0, 1).toUpperCase();

            if (names.length > 1) {
              initials += names[names.length - 1].substring(0, 1).toUpperCase();
            }
            return initials;
          } else {
            // var names = string.split(' '),
            initials = string.substring(0, 1).toUpperCase();

            if (names.length > 1) {
              initials += names[names.length - 1].substring(0, 1).toUpperCase();
            }
            return initials;
          }
        };
        return (
          <div>
            {
              record.user_img ?
                <Avatar className="gx-mr-3 gx-size-36" src={Service.Server_Base_URL + "/uploads/user_images/" + record?.user_img} /> :

                <Avatar>{getInitials(record.first_name + " " + record.last_name)}</Avatar>
            }
          </div>
        );
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record, index) => {
        const first_name =
          record.first_name
        const last_name =
          record.last_name
        return <Link type="button" to={`/employee/view-employee/${record._id}`}> <span style={{ textTransform: "capitalize" }}>{first_name + " " + last_name}</span></Link>;
      },
    },
    // {
    //   title: "Event Type",
    //   dataIndex: "event_type_id",
    //   key: "eventType",
    //   render: (text, record, index) => {
    //     const event_type = record?.event_type
    //     return <span style={{ textTransform: "capitalize" }}>{event_type}</span>

    //   }

    // },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (text, record, index) => (
        // const department = record.department[0]?.department_name.charAt(0).toUpperCase() + record.department[0]?.department_name.slice(1);
        // return department
        <Tag style={{ textTransform: "capitalize" }}>{record.department?.department_name}</Tag>
      ),
    },
    {
      title: "Contact Number",
      dataIndex: "phone_number",
      key: "contact",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Total Credit",
      dataIndex: "credits",
      key: "credits",
    },
    {
      title: "Designation",
      dataIndex: "designation",
      key: "credit",
      render: (text, record, index) => {
        const position = record?.designation?.designation_name
        // <span>{record.position?.position}</span>
        return <span style={{ textTransform: "capitalize" }}>{position}</span>
      }
    },
    {
      title: "Status",
      dataIndex: "isDeleted",
      width: 100,
      render: (text, record, index) => {
        return (<>
          <div
            style={{
              display: "flex",
              flexwrap: "wrap",
            }}
          >
            <Select
              className={`select ${record.isDeleted ? 'Deactivate' : 'Activated'}`}
              size="large"
              defaultValue={record.isDeleted}
              onSelect={() => actionEmp(record._id, index)}
            >
              <Option value={false} style={{ color: 'green' }}>Activate</Option>
              <Option value={true} style={{ color: 'red' }}>Deactivate</Option>
            </Select>
          </div>
        </>)
      },
    },
    {
      title: "Actions",
      dataIndex: "action",
      render: (text, record, index) => (
        <div
          style={{
            display: "flex",
            flexwrap: "wrap",
          }}
        >
          {/* <Button type="link success" onClick={() => openUserModal()}>
            <EditOutlined style={{ fontSize: '18px' }} />
          </Button> */}
          <Link type="button" to={`/employee/update-employee/${record._id}`}>
            <Button type="link success">
              <EditOutlined style={{ fontSize: "18px" }} />
            </Button>
          </Link>
          {/* <Link type="button" to={`/employee/view-employee/${record._id}`}>
            <Button type="link success" title="View" >
              <EyeOutlined style={{ fontSize: "18px" }} />
            </Button>
          </Link> */}
        </div>
      ),
    },
  ];
  const getDepartmentList = async () => {
    try {
      // dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.departmentDropdownList,
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        const dept = response.data.data;
        setDeptData(dept);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  // const searchh = (rows) => {
  //   const columns = rows[0] && Object.keys(rows[0]);
  //   return rows.filter((row) =>
  //     columns.some(
  //       (column) =>
  //         row[column]?.toString().toLowerCase().indexOf(q.toLowerCase()) > -1
  //     )
  //   );
  // };
  const handleTableChange = (page, filters, sorter) => {
    setPagination({ ...pagination, ...page });
  };

  const getFooterDetails = () => {
    return (
      <label>
        Total Records Count is {pagination.total > 0 ? pagination.total : 0}
      </label>
    )
  }
  const onReset = () => {
    form.resetFields();
    setFilterData(null);
  };
  const getEventType = async () => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.eventsType,
      });
      // setDeptData(response.data.data)

      if (response.data && response.data.data) {
        const eventType = response.data.data;
        setEventTypeApiData(eventType);
      }
      else {
        message.error(response.data.message)
      }
    } catch (error) {

      console.log(error);
    }
  };
  const csvData = [
    ["Email", "First_Name", "Last_Name", "Position", "Department_name", "Phone_Number"],
    ["tarun@elsner.com", "Tarun", "Bansal", "TL", "PHP", "8574859654"],
  ];
  return (
    <>
      <Card title="Employees" className="employee-card">
        <Link to="/employee/add-employee">
          <Button type="primary" style={{ float: "right" }}>
            Add Employee
          </Button>
        </Link>
        {/* <Link to="./user.csv" download>CSV Format</Link> */}
        <CSVLink data={csvData} filename={"Employee_CSV_format.csv"} style={{ textDecoration: "none" }}>
          <Button style={{ float: "right", marginRight: "22px" }}
          //  onClick={downloadFormat
          >
            <DownloadOutlined />
            CSV Format
          </Button>
        </CSVLink>
        <Search
          ref={searchRef}
          placeholder="Search..."
          onSearch={onSearch}
          onKeyUp={resetSearchFilter}
          style={{ width: 200 }}
          className='mr2'
        />
        <Button onClick={() => openEventModalView()} className='mr2'>Filter</Button>
        <input
          type="file"
          size="small"
          onChange={(e) => {
            const file = e.target.files[0];
            readExcel(file);
          }}
          style={{
            display: "none"
          }}
          ref={importRef}
        />
        <Button onClick={() => importRef.current.click()} className='mr2'>
          Import
        </Button>
        {/* <CSVLink> */}
        <Button onClick={exportCsv} className='mr2'>
          Export</Button>
        {/* </CSVLink> */}

        <p className="event-type">{
          filterData?.event_types &&
          <Tag>Event Type: {eventTypeApiData.find(item => item._id === filterData.event_types).event_type} </Tag>
        }</p>

        <Table columns={columns}
          pagination={
            {
              showSizeChanger: true,
              ...pagination
            }
          }
          footer={getFooterDetails}
          onChange={handleTableChange}
          dataSource={eventEmpData} />
      </Card>
      <Modal
        title="Filter"
        width={800}
        visible={IsModalView}
        okText="Update"
        footer={false}
        onCancel={closeEventModalView}
      >
        <div className="filter-pop-wrapper">
          <Row>

            <Col span={10}>

              <Form
                form={form}
                initialValues={{
                  isActive: 'All',
                }}
                onFinish={filterEmp}
              >
                <Form.Item
                  label="Status"
                  name="isActive"
                >
                  <Radio.Group>
                    <Space direction="vertical">
                      <Radio value={'All'}>All</Radio>
                      <Radio value={true}>Active</Radio>
                      <Radio value={false}>Deactive</Radio>
                    </Space>
                  </Radio.Group>

                </Form.Item>
                <Form.Item
                  label="By Department"
                  name="departments"
                >
                  <Select
                    mode="multiple"
                    showSearch
                    placeholder="Select a Department Type"
                    style={{ width: 200 }}
                    name="department"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {deptData.map((data, index) => (
                      <Option key={index} value={data._id} style={{ textTransform: "capitalize" }} >
                        {data?.department_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  label="Select a Event Type"
                  name="event_types"
                >
                  <Select
                    // mode="multiple"
                    showSearch
                    placeholder="Select a Event Type"
                    style={{ width: 200 }}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    value={eventType}
                    onChange={(e) => setEventType(e)}
                  >
                    {eventTypeApiData.map((data, index) => (
                      <Option key={index} value={data._id} style={{ textTransform: "capitalize" }}>
                        {data?.event_type}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Row style={{ marginTop: 10 }}>
                  <Button type="primary" htmlType="submit">Apply</Button>
                  <Button onClick={onReset}>
                    Reset
                  </Button>
                  <Button onClick={closeEventModalView}>Cancel</Button>
                </Row>
              </Form>
            </Col>
          </Row>
        </div>
      </Modal>

    </>
  );
};

export default EmployeeList;

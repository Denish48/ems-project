import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Input,
  Table,
  Modal,
  Button,
  Card,
  Popconfirm,
  DatePicker,
  Row,
  Col,
  Select,
  message,
  Tag,
  Form,
  Radio,
  Space
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  CopyOutlined,
  AliyunOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Service from "../../service";
import {
  showAuthLoader,
  hideAuthLoader,
} from "../../appRedux/actions/Auth";
import "./eventfilter.css";

const Search = Input.Search;
const { Option } = Select;

const Event = (props) => {
  const [IsModalView, setIsModalView] = useState(false);
  const [eventApiData, setEventApiData] = useState([]);
  const [eventTypeApiData, setEventTypeApiData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [eventType, setEventType] = React.useState(null);
  const [searchText, setSearchText] = useState("");
  const [seachEnabled, setSearchEnabled] = useState(false);
  let [filterData, setFilterData] = useState(null);
  const [form] = Form.useForm();

  const { authUser } = useSelector(
    ({ auth }) => auth
  );
  const searchRef = useRef();
  const dispatch = useDispatch();

  const onSearch = (value) => {
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
  };
  const handleTableChange = (page, filters, sorter) => {
    setPagination({ ...pagination, ...page });
  };

  const openEventModalView = () => {
    setIsModalView(true);
  };

  const getFooterDetails = () => {
    return (
      <label>
        Total Records Count is {pagination.total > 0 ? pagination.total : 0}
      </label>
    )
  }

  // const closeEventModalView = () => {
  //   // setEvent_record(record);
  //   setIsModalView(false);
  // };
  const closeEventModalView = () => {
    // setEvent_record(record);
    form.resetFields();
    setIsModalView(!IsModalView);
    setFilterData([]);
  };
  const getCloneEvent = async (id) => {
    try {
      // dispatch(showAuthLoader());
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.eventClone + params,
        body: {
          user_id: authUser?._id,
        }
      });
      // dispatch(hideAuthLoader());
      if (response?.data?.data?._id) {
        props.history.push(`/event/update-event/${response.data.data._id}`);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const DeleteEvent = async (id) => {
    try {
      // dispatch(showAuthLoader());
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.deleteMethod,
        api_url: Service.eventDelete + params,
        body: {
          user_id: authUser?._id,
        },
      });
      // dispatch(hideAuthLoader());

      if (response.data && response.data.data.isDeleted) {
        message.success(response.data.message)

        getEvent();
      } else {
        message.error(response.data.message)
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  const filterEvent = async (values) => {
    console.log(values);
    setFilterData(values);
    setIsModalView(!IsModalView);

  };

  console.log(eventApiData);

  const resetFilterEvent = async (values) => {
    form.resetFields();
    setFilterData(null);
    // await getEvent();
    // closeEventModalView();
  };
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
  const getDepartmentList = async () => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.departmentDropdownList,
      });
      if (response.data && response.data.data) {
        const dept = response.data.data;
        setDeptData(dept);
      }
      else {
        message.error("Something went wrong")
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getEvent = useCallback(async () => {
    try {

      // dispatch(showAuthLoader());
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
          reqBody.departments = filterData.departments;
        }

        if (filterData.event_types?.length > 0 && filterData.event_types !== 'All') {
          reqBody.event_types = filterData.event_types;
        }
        if (filterData.date_type) {
          reqBody.date_type = filterData.date_type;
        }
        if (typeof filterData.department !== "undefined" && filterData.department !== 'all') {
          reqBody.department = filterData.department;
        }
        if (filterData.dates?.length > 0) {
          const start_date = filterData.dates[0].toISOString();
          const end_date = filterData.dates[1].toISOString();
          reqBody.start_date = start_date;
          reqBody.end_date = end_date;
        }
        if (filterData.end_date) {
          reqBody.end_date = filterData?.end_date;
        }

        if (typeof filterData.status !== "undefined" && filterData.status !== 'All') {
          reqBody.status = filterData.status;
        }
      }
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.eventsList,
        body: reqBody,
      });
      // dispatch(hideAuthLoader());
      if (!response) {
        return Service.messageError(Service.error_message);
      }
      if (
        response &&
        response.data &&
        response.data.data
      ) {
        if (response.data.data.length > 0) {
          const eventDetails = response.data.data;
          console.log(eventDetails,"eventDetails");
          setEventApiData(eventDetails);
          setPagination({
            ...pagination,
            total: response.data.metaData.totalFilteredCount,
          });
        } else {
          setPagination({
            ...pagination,
            total: 0,
          });
          setEventApiData([]);
          message.error(response.data.message);
        }
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  }, [filterData, searchText, pagination.current, pagination.pageSize]);
  const exportCsv = async (id) => {
    try {
      // const org_id = authUser.org_id?._id
      // const params = `/${id}`;
      // window.open('' + Service.exportemployees + params, "_blank");

      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.exportEvents
      });
      if (response?.data?.data && response.data.status === 200) {
        let base64 = response.data.data;
        // var blob = new Blob([base64], { type: "data:application/octet-stream;base64" });
        // const linkSource = window.URL.createObjectURL(blob);
        const linkSource = 'data:text/csv;base64,' + base64;
        const downloadLink = document.createElement("a");
        const fileName = "Event.csv";

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
      console.log(error);
    }
  }

  const actionEvent = async (index, value) => {
    console.log("index", index);
    try {
      // dispatch(showAuthLoader());
      const id = eventApiData[index]._id
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.eventStatus,
        body: {
          event_id: id,
          event_status: value,
          user_id: authUser._id
        }
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        console.log("response.data.data", response.data.data);
        eventApiData[index] = {
          ...eventApiData[index],
          status: value
        };
        message.success(response.data.message)
        const newEmp = eventApiData;
        setEventApiData([]);
        setEventApiData(newEmp);
      }
      else {
        message.error(response.data.message)
      }
    } catch (error) {
      dispatch(hideAuthLoader());
      console.log(error);
    }
  }
  useEffect(() => {
    getEventType();
    getDepartmentList();
  }, []);

  useEffect(() => {
    getEvent();
  }, [getEvent]);
  const columns = [
    {
      title: "Event Name",
      dataIndex: "event_name",
      key: "name",
      render: (text, record, index) => {
        const event_name =
          record.event_name
        return <Link type="button" to={`/event/event-view/${record._id}`}><span style={{ textTransform: "capitalize" }}>{event_name}</span></Link>;
      },
    },
    {
      title: "Event Type",
      dataIndex: "event_type_id",
      key: "eventType",
      render: (text, record, index) => {
        const event_type = record.event_type?.event_type
        return <span style={{ textTransform: "capitalize" }}>{event_type}</span>

      }

    },
    {
      title: "Host",
      dataIndex: "host_users",
      key: "trainerName",
      render: (text, record, index) => (
        record.host_users.map((hostname)=>{
//console.log("hostname",hostname.first_name);
       return <Tag key={index} style={{ textTransform: "capitalize" }}>   {hostname.first_name + " " +hostname.last_name }</Tag>
        })
      ),
    },
    {
      title: "Department",
      dataIndex: "departments",
      key: "department",
      render: (text, record, index) => {
        if (record?.departments?.length > 0) {
          if (record?.departments?.length === deptData.length) {
            return <Tag style={{ textTransform: "capitalize" }}>All</Tag>
          } else {
            return record.departments.map((dept, index) => {
              const department = dept?.department_name;
              return <Tag key={index} style={{ textTransform: "capitalize" }}>{department}</Tag>
            });
          }
        } else {
          return null;
        }
      },
    },
    {
      title: "Credit",
      dataIndex: "credit",
      key: "credit",
    },
    {
      title: "Status",
      dataIndex: "status",
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
              className={`select ${record.status}`}
              size="large"
              defaultValue={record.status}
              onSelect={(value) => actionEvent(index, value)}
            >
              <Option value={"inprogress"} style={{ color: "greenyellow" }}>Inprogress</Option>
              <Option value={"upcoming"} style={{ color: "orchid" }}>Upcoming</Option>
              <Option value={"completed"} style={{ color: "green" }}>Completed</Option>
              <Option value={"cancel"} style={{ color: "red" }}>Cancel</Option>
            </Select>
          </div>
        </>)
      },
    },
    {
      title: "Start Date",
      dataIndex: "date",
      key: "time_date",
      render: (text, record, index) => {
        // var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];

        if (!record.start_date) return null;
        const date = new Date(record.start_date);
        const datestring = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear()

        if (record.start_time) {
          const start_time = new Date(record.start_time);
          let hours = start_time.getHours()
          let minutes = start_time.getMinutes()
          if (hours < 10) { hours = "0" + hours; }
          if (minutes < 10) { minutes = "0" + minutes; }

          return (
            <div className="start-date">
              <span>{datestring}</span>
              <br />
              {/* <span>{hours + ':' + minutes}</span> */}
            </div>
          )
        } else {
          return (
            <div className="start-date">
              <span>{datestring}</span>
            </div>
          )
        }
      },
    },
    {
      title: "End Date",
      dataIndex: "date",
      key: "time_date",
      render: (text, record, index) => {
        // var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];

        if (!record.end_date) return null;
        const date = new Date(record.end_date);
        const datestring = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear()
        if (record.end_time) {
          const end_time = new Date(record.end_time);
          let hours = end_time.getHours()
          let minutes = end_time.getMinutes()
          if (hours < 10) { hours = "0" + hours; }
          if (minutes < 10) { minutes = "0" + minutes; }
          return (
            <div className="start-date">
              <span>{datestring}</span>
              <br />
              {/* <span>
                {hours + ':' + minutes}</span> */}
            </div>
          )
        } else {
          return (
            <div className="start-date">
              <span>{datestring}</span>
            </div>
          )
        }
      },
    },
    {
      title: "Venue/URL",
      dataIndex: "venue",
      key: "vanue",
      render: (text, record, index) => {
        if (record.venue) {
          if (new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?").test(record.venue) && record.venue.includes('/maps')) {
            return <a href={record.venue_url} target="_blank" rel="noreferrer">
              <Button type="link success" title="View">
                <AliyunOutlined
                  style={{ fontSize: "18px" }}
                />
              </Button>
            </a>
          } else {
            const venue = record.venue
            return <a href={record.venue_url} target="_blank" rel="noreferrer"> <span style={{ wordBreak: "break-word", color: "black" }}>{venue}</span>
            </a>
          }
        }
        else {
          return null
        }
      },
    },

    {
      title: "Seats Booked",
      dataIndex: "event_seats",
      key: "total_participants",
      render: (text, record, index) => {
        if (record.event_seats) {
          return <span>{typeof record.seats_booked === 'number' ? record.seats_booked : 0}/{record.event_seats}</span>
        } else if (record.event_seats) {
          return <span>{typeof record.seats_booked === 'number' ? record.seats_booked : 0}</span>
        } else {
          return "Unlimited";
        }
      }
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
          {/* <Button type="link success" onClick={EditEvent(record)}>
            <EditOutlined style={{ fontSize: '18px' }} />
          </Button> */}
          <Link type="button" to={`/event/update-event/${record._id}`}>
            <Button type="link success" title="Update">
              <EditOutlined style={{ fontSize: "18px" }} />
            </Button>
          </Link>
          {/* <Link type="button" to={`/event/event-view/${record._id}`}>
            <Button type="link success" title="View">
              <EyeOutlined
                style={{ fontSize: "18px" }}
              // onClick={() => openEventModalView(record)}
              />
            </Button>
          </Link> */}

          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => DeleteEvent(record._id)}
          >
            <Button type="link success" title="Delete">
              <DeleteOutlined style={{ fontSize: "18px" }} />
            </Button>
          </Popconfirm>
          <Link type="button">
            <Button type="link success" title="Clone this event" onClick={() => getCloneEvent(record._id)}>
              <CopyOutlined style={{ fontSize: "18px" }} />
            </Button>
          </Link>
        </div>
      ),
    },
  ];
  return (
    <>
      <Card title="Events">
        <div className="sticky-header">
          <Search
            ref={searchRef}
            placeholder="Search..."
            onSearch={onSearch}
            onKeyUp={resetSearchFilter}
            style={{ width: 200 }}
            className='mr2'
          />
          <Button onClick={() => openEventModalView()} className='mr2'>Filter</Button>
          <Button onClick={exportCsv} className='mr2'>
            Export</Button>
          <Link to="/event/add-event">
            <Button type="primary" style={{ float: "right" }}>
              Add Event
            </Button>
          </Link>
        </div>
        <div className="event-table-wraper">
          <Table
            pagination={
              {
                showSizeChanger: true,
                
                ...pagination
              }
            }
            onChange={handleTableChange}
            columns={columns}
            dataSource={eventApiData}
            footer={getFooterDetails}
            rowKey={(record) => record._id}
          />
        </div>
      </Card>
      <Modal
        title="Filter"
        width={900}
        visible={IsModalView}
        okText="Update"
        footer={false}
        onCancel={closeEventModalView}
        // destroyOnClose={() => setIsModalView(false)}
        onOk={() => {
          // code to be implemented
        }}
      >
        <div className="filter-pop-wrapper">
          <Form
            form={form}
            initialValues={{
              status: 'All',
            }}
            onFinish={filterEvent}
          >
            <Row>
              <Col span={10}>

                <Form.Item
                  label="Date Type"
                  name="date_type"
                >
                  <Select
                    style={{ width: 300 }}

                  >
                    <Option value="current_month">Current Month</Option>
                    <Option value="previous_month">Previous Month</Option>
                    <Option value="current_quarter">Current Quarter</Option>
                    <Option value="previous_quarter">Previous Quarter</Option>
                    <Option value="custom_range">Custom Range</Option>
                  </Select>
                </Form.Item>
                <div>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues.date_type !== currentValues.date_type
                    }
                  >
                    {({ getFieldValue }) =>
                      getFieldValue("date_type") === "custom_range" ? (
                        <Form.Item
                          label="Select a Dates range"
                          name="dates"
                        >
                          <DatePicker.RangePicker />
                        </Form.Item>
                      ) : null
                    }
                  </Form.Item>
                </div>
                <Form.Item
                  label="Select a Event Type"
                  name="event_types"
                >
                  <Select
                    mode="multiple"
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
              </Col>
              <Col span={14}>
                <Form.Item
                  label="Status"
                  name="status"
                >
                  <Radio.Group>
                    <Space direction="vertical" >
                      <Radio value={"All"}>All</Radio>
                      <Radio value={"completed"}>Completed</Radio>
                      <Radio value={"upcoming"}>Upcoming</Radio>
                      <Radio value={"inprogress"}>Inprogress</Radio>
                      <Radio value={"cancel"}>Cancel</Radio>
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
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {/* <Option key="all" value="all">ALL</Option> */}
                    {deptData.map((data, index) => (
                      <Option key={index} value={data._id} style={{ textTransform: "capitalize" }}>
                        {data?.department_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Row style={{ marginTop: 10 }}>
                  <Button type="primary" htmlType="submit">Apply</Button>
                  <Button onClick={resetFilterEvent}>Reset</Button>
                  <Button onClick={closeEventModalView}>Cancel</Button>
                </Row>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>
    </>
  );
};

export default Event;
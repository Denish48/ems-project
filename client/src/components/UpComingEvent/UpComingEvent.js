import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Input,
  Table,
  Card,
  Tag,
  Button,
  Popconfirm,
  message,
  Row,
  Select,
  DatePicker,
  Col,
  Modal,
  Form
} from "antd";
import { useSelector } from 'react-redux';
import Service from "../../service";
import { Link } from "react-router-dom";
import { AliyunOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";

const Search = Input.Search;
const { Option } = Select;

const UpComingEvent = (props) => {
  const [eventApiData, setEventApiData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [searchText, setSearchText] = useState("");
  const [seachEnabled, setSearchEnabled] = useState(false);
  const [deptData, setDeptData] = useState([]);
  const [IsModalView, setIsModalView] = useState(false);
  let [filterData, setFilterData] = useState(null);
  const [eventTypeApiData, setEventTypeApiData] = useState([]);
  const [eventType, setEventType] = useState(null);
  const [form] = Form.useForm();
  const searchRef = useRef();
  const { authUser } = useSelector(
    ({ auth }) => auth
  );


  useEffect(() => {
    getEventType()
    getDepartmentList();
  }, [searchText, pagination.current, pagination.pageSize]);

  const onSearch = (value) => {
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
  };
  const handleTableChange = (page, filters, sorter) => {
    setPagination({ ...pagination, ...page });
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
        console.log(eventType);
        setEventTypeApiData(eventType);
      }
      else {
        message.error(response.data.message)
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

        // if (typeof filterData.status !== "undefined" && filterData.status !== 'All') {
        //   reqBody.status = filterData.status;
        // }
      }
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.upcomingEvents,
        body: reqBody

      });
      // dispatch(hideAuthLoader());

      if (response.data && response.data.data?.length > 0) {
        setPagination({
          ...pagination,
          total: response.data.metaData.totalFilteredCount,
        });
        const upcoming = response.data.data
        setEventApiData([])
        setEventApiData(upcoming);
      }
      else {
        setPagination({
          ...pagination,
          total: 0,
        });
        setEventApiData([])
        message.error(response.data.message)
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  }, [filterData, searchText, pagination.current, pagination.pageSize])

  const getFooterDetails = () => {
    return (
      <label>
        Total Records Count is {pagination.total > 0 ? pagination.total : 0}
      </label>
    )
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
  const DeleteEvent = async (id) => {
    try {
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.deleteMethod,
        api_url: Service.eventDelete + params,
        body: {
          user_id: authUser?._id,
        },
      });
      if (response.data && response.data.data) {
        getEvent();
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getEvent();
  }, [getEvent]);
  const columns = [
    {
      title: "Event Name",
      dataIndex: "event_name",
      key: "name",
      render: (text, record, index) => {
        const event_name = record.event_name.charAt(0).toUpperCase() + record.event_name.slice(1);
        return <Link type="button" to={`/event/event-view/${record._id}`}>{event_name}</Link>
      }
    },
    {
      title: "Event Type",
      dataIndex: "event_type",
      key: "eventType",
      render: (text, record, index) => {
        if (record.event_type?.event_type) {
          const eventType =
            record.event_type?.event_type.charAt(0).toUpperCase() +
            record.event_type?.event_type.slice(1);
          return eventType;
          // <span>{record.event_type?.event_type}</span>
        }
        else {
          return null
        }
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
      title: "Time/Date",
      dataIndex: "date",
      key: "time_date",
      render: (text, record, index) => {
        if (!record?.event_dates) return null;
        const date = new Date(record?.event_dates[0]?.start);
        return <span>{date.toDateString()}</span>;
      },
    },
    {
      title: "Venue/URL",
      dataIndex: "venue",
      key: "vanue",
      render: (text, record, index) => {
        if (record.venue) {
          if (new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?").test(record.venue) && record.venue.includes('/maps')) {
            return <a href={record.venue} target="_blank" rel="noreferrer">
              <Button type="link success" title="View">
                <AliyunOutlined
                  style={{ fontSize: "18px" }}
                />
              </Button>
            </a>
          } else {
            const venue = record.venue.charAt(0).toUpperCase() + record.venue.slice(1);
            return <span style={{ wordBreak: "break-word" }}>{venue}</span>;
          }
        }
        else {
          return null
        }
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
          {/* <Button type="link success" onClick={EditEvent(record)}>
            <EditOutlined style={{ fontSize: '18px' }} />
          </Button> */}
          <Link type="button" to={`/event/update-event/${record._id}`}>
            <Button type="link success" title="Update">
              <EditOutlined style={{ fontSize: "18px" }} />
            </Button>
          </Link>
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => DeleteEvent(record._id)}
          >
            <Button type="link success" title="Delete">
              <DeleteOutlined style={{ fontSize: "18px" }} />
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];
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
    } catch (error) {
      console.log(error);
    }
  };
  const closeEventModalView = () => {
    // setEvent_record(record);
    form.resetFields();
    setIsModalView(!IsModalView);
    setFilterData([]);
  };
  const filterEvent = async (values) => {
    console.log(values);
    setFilterData(values);
    setIsModalView(!IsModalView);

  };
  const openEventModalView = () => {
    setIsModalView(true);
  };
  const resetFilterEvent = async (values) => {
    form.resetFields();
    setFilterData(null);
    // await getEvent();
    // closeEventModalView();
  };
  return (
    <>
      <Card title="Upcoming Events">
        <Search
          ref={searchRef}
          placeholder="Search..."
          onSearch={onSearch}
          onKeyUp={resetSearchFilter}
          style={{ width: 200 }}
        />
        <Button onClick={() => openEventModalView()} className='mr2'>Filter</Button>

        <Table
          pagination={
            {
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "30"],
              ...pagination
            }
          }
          onChange={handleTableChange}
          footer={getFooterDetails}
          columns={columns}
          dataSource={eventApiData} />
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

export default UpComingEvent;

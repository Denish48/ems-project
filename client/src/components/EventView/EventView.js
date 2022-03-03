import React, { useEffect, useState } from "react";
import {
  Card, Image,
  Row, Col, List, Button, Table, message, Tag
} from "antd";
import {
  EyeOutlined,
  AliyunOutlined
} from "@ant-design/icons";
import {
  showAuthLoader,
  hideAuthLoader,
} from "../../appRedux/actions/Auth";
import { useDispatch } from 'react-redux';
import Service from "../../service";
import ParticipateEmp from "../ParticipateEmp/ParticipateEmp";
import EventChart from "../EventChart/EventChart";
import { Tabs } from 'antd';
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
const { TabPane } = Tabs;

const EventView = (props) => {
  const [eventApiData, setEventApiData] = useState(null);
  const id = props.match.params.id;
  const [feedbackData, setFeedbackData] = useState([])
  const [searchText, setSearchText] = useState("");
  const [seachEnabled, setSearchEnabled] = useState(false);
  const [deptData, setDeptData] = useState([]);
  const [attedence, setAttedence] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [activeTab, setActiveTab] = useState('1');
  const [attedencepagination, setAttedencePagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const dispatch = useDispatch();
  useEffect(() => {
    getEventById();
    // getFeedback();
    getDepartmentList();
    // getAttedence();
  }, [searchText, pagination.current, pagination.pageSize, attedencepagination.current, attedencepagination.pageSize])
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
  const handleTableChange = (page, filters, sorter) => {
    setPagination({ ...pagination, ...page });
  };
  const attedencehandleTableChange = (page, filters, sorter) => {
    setPagination({ ...attedencepagination, ...page });
  };
  const getFooterDetails = () => {
    return (
      <label>
        Total Records Count is {pagination.total > 0 ? pagination.total : 0}
      </label>
    )
  }
  const getAttedenceFooter = () => {
    return (
      <label>
        Total Records Count is {attedencepagination.total > 0 ? attedencepagination.total : 0}
      </label>
    )
  }
  const getFeedback = async () => {
    try {
      // dispatch(showAuthLoader());
      const params = `${id}`;
      const reqBody = {
        pageNum: pagination.current,
        pageLimit: pagination.pageSize,
        event_id: params,


      };
      if (searchText && searchText != "") {
        reqBody.search = searchText;
        setSearchEnabled(true);
      }
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.feedbackList,
        body: reqBody
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        setPagination({
          ...pagination,
          total: response.data.metaData.totalFilteredCount,
        });
        setFeedbackData(response.data.data)
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const getEventById = async () => {
    try {
      dispatch(showAuthLoader());
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.eventById + params,
      });

      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        const eventView = response.data.data
        setEventApiData(eventView);
      }
    } catch (error) {
      dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  const getAttedence = async () => {
    try {
      const params = `${id}`;
      // const host_user_id = `${eventApiData.host_user_id._id}`
      const reqBody = {
        pageNum: attedencepagination.current,
        pageLimit: attedencepagination.pageSize,
        event_id: params,
        // host_user_id: host_user_id
      };
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.hostAttendanceReport,
        body: reqBody
      });
      if (response.data && response.data.data) {
        const listAttedence = response.data.data;
        setAttedencePagination({
          ...attedencepagination,
          total: response.data.metaData.totalFilteredCount,
        });
        setAttedence(listAttedence);

      }
      else {
        message.error("Something went wrong")
      }
    } catch (error) {
      console.log(error);
    }
  };
  if (!eventApiData) {
    return null;
  }
  function callback(key) {
    console.log(key);
    setActiveTab(key);
    if (key === '3') {
      getFeedback();
    }
    if (key === '4') {
      getAttedence();
    }
  }
  // if (record?.departments?.length === deptData.length) {
  //   return <Tag style={{ textTransform: "capitalize" }}>All</Tag>
  // } else {
  //   return record.departments.map((dept, index) => {
  //     const department = dept?.department_name;
  //     return <Tag key={index} style={{ textTransform: "capitalize" }}>{department}</Tag>
  //   });
  // }

  const start_date = new Date(eventApiData.start_date).toDateString();
  const end_date = new Date(eventApiData.end_date).toDateString();
  const start_time = new Date(eventApiData?.start_time);
  let Starthours = start_time.getHours()
  let Startminutes = start_time.getMinutes()
  const end_time = new Date(eventApiData?.end_time);
  let hours = end_time.getHours()
  let minutes = end_time.getMinutes()
  if (hours < 10) { hours = "0" + hours; }
  if (minutes < 10) { minutes = "0" + minutes; }
  if (Starthours < 10) { Starthours = "0" + Starthours; }
  if (Startminutes < 10) { Startminutes = "0" + Startminutes; }

  const onCancel = () => {
    if (props.history.length > 1) {
      props.history.goBack();
    } else {
      props.history.push('/dashboard');
    }
  };

  const GetVenueDetails = () => {
    if (new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?").test(eventApiData.venue_url) && eventApiData.venue_url.includes('/maps')) {
      return <a href={eventApiData.venue_url} target="_blank" rel="noreferrer">
        <Button type="link success" title="View" style={{ margin: 0 }}>
          <AliyunOutlined
            style={{ fontSize: "18px" }}
          />
        </Button>
      </a>
    } else {
      const venue = eventApiData.venue.charAt(0).toUpperCase() + eventApiData.venue.slice(1);
      return <span style={{ wordBreak: "break-word" }}>{venue}</span>;
    }
  }

  const columnsFeedback = [
    {
      title: 'Event Name',
      dataIndex: 'event',
      key: 'event_name',
      render: (text, record, index) => (
        <span style={{ textTransform: "capitalize" }}>{record?.event?.event_name}</span>
      ),
    },
    {
      title: "User Name",
      dataIndex: "full_name",
      key: "name",
      render: (text, record, index) => {
        const full_name =
          record?.user?.full_name

        return <span style={{ textTransform: "capitalize" }}>{full_name}</span>
      },
    },
    // {
    //   title: "Rating",
    //   dataIndex: "rating",
    //   key: "credit",
    //   render: (text, record, index) => {
    //     if (record.answers?.length > 0 &&
    //       typeof record.answers[0] === 'object' &&
    //       record.answers[0]['statisfaction-starRating-0']) {
    //       const rating = record.answers[0]['statisfaction-starRating-0'];
    //       if (rating === 5) {
    //         return <span style={{ textTransform: "capitalize" }}>Very Satisfied</span>
    //       }
    //       if (rating === 4) {
    //         return <span style={{ textTransform: "capitalize" }}>Satisfied</span>
    //       }
    //       if (rating === 3) {
    //         return <span style={{ textTransform: "capitalize" }}>Good</span>
    //       }
    //       if (rating === 2) {
    //         return <span style={{ textTransform: "capitalize" }}>Bad</span>
    //       }
    //       if (rating === 1) {
    //         return <span style={{ textTransform: "capitalize" }}>Very Bad</span>
    //       }
    //       if (rating === 0) {
    //         return <span style={{ textTransform: "capitalize" }}>Very Bad</span>
    //       }
    //     }
    //     else {
    //       return null
    //     }
    //   }
    // },
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
          <Link type="button" to={`/feedback-view/${record._id}`}>
            <Button type="link success" title="View">
              <EyeOutlined
                style={{ fontSize: "18px" }}
              />
            </Button>
          </Link>

        </div>
      ),
    },
  ];

  const columnsAttedence = [
    {
      title: "Session",
      dataIndex: "_id",
      key: "_id",
      editable: true,
      render: (text, record, index) => {
        if (pagination.current > 1) {
          const skip = pagination.pageSize * (pagination.current - 1);
          return "Session " + index + skip + 1
        }
        return "Session " + (index + 1)
      },
    },
    {
      title: "Event",
      dataIndex: "event_name",
      key: "name",
      render: (text, record, index) => {
        const event_name = record.event?.event_name
        return <span style={{ textTransform: "capitalize" }}>{event_name}</span>
      },
    },
    {
      title: "Time/Date",
      dataIndex: "event_session_start",
      key: "event_session_start",
      render: (text, record, index) => {
        if (!record?.event_session_start) return "-";
        const date = new Date(record?.event_session_start);
        return <span>{date.toDateString()}</span>;
      },
    },
    {
      title: "Host Name",
      dataIndex: "host_user",
      key: "name",
      editable: true,
      render: (text, record, index) => {
        // const department_name = record.department_name
        return <span style={{ textTransform: "capitalize" }}>{record?.host_users?.first_name + " " + record?.host_users?.last_name}</span>
      },
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
  ];
  const sessionDetails = (record) => {
    console.log('record', record);
    const columns = [
      {
        title: "User Name",
        dataIndex: "users",
        key: "users",
        editable: true,
        render: (text, record, index) => {
          console.log('record 2', record);
          return <span style={{ textTransform: "capitalize" }}>{record?.first_name + " " + record?.last_name}</span>
        },
      },
      {
        title: "Department",
        dataIndex: "department_name",
        key: "department_name",
        editable: true,
        render: (text, record, index) => {
          console.log('record 2', record);
          if (record?.department_name) {
            const department = record?.department_name;
            return <Tag key={index} style={{ textTransform: "capitalize" }}>{department}</Tag>
          } else {
            return null;
          }
        },
      },
    ];
    return <Table columns={columns} dataSource={record.users} pagination={false} />;
  };
  return (
    <div >
      <Row>
        <Col span={24} >
          <Button type="primary" style={{ float: "right" }} onClick={onCancel}>
            Back
          </Button>
        </Col>
      </Row>
      <Tabs activeKey={activeTab} defaultActiveKey="1" onChange={callback}>
        <TabPane tab="Event View" key="1">
          <Card title="Event View">
            <Row>
              <Col style={{ boxShadow: "0 0 5px 5px rgb(0 0 0 / 3%)", marginBottom: "32px", borderRadius: "10px" }}
                span={14} md={16} sm={16} xs={24}>
                <List
                  itemLayout="horizontal"
                >
                  <List.Item>Event Name : {eventApiData.event_name}</List.Item>
                  <List.Item>Event Type : {eventApiData?.event_type_id?.event_type}</List.Item>
                  <List.Item>Host Name:  {eventApiData?.host_users.map((hu) =>
                    <Tag> {hu?.first_name + " " + hu?.last_name}</Tag>)}
                  </List.Item>
                  {/*<List.Item>Host Name : {eventApiData.host_users?.first_name + " " + eventApiData.host_user_id?.last_name}</List.Item>*/}
                  {
                    eventApiData.departments?.length === deptData.length ?
                      <List.Item >Department: <Tag style={{ textTransform: "capitalize" }}>All</Tag></List.Item> :
                      <>
                        <List.Item >Department: {eventApiData.departments?.length && eventApiData.departments.map((dept) => <Tag> {dept?.department_name}</Tag>)}
                        </List.Item>
                      </>


                  }
                  <List.Item>Credit: {eventApiData?.credit}</List.Item>
                  <List.Item>Event start Date:{start_date} </List.Item>
                  <List.Item>Event end Date: {end_date}</List.Item>
                  {
                    eventApiData.allDay === true ?
                      <List.Item>Event Duration: All day </List.Item> :

                      <>
                        <List.Item>Event start Time:<span>{Starthours + ':' + Startminutes} </span></List.Item>
                        <List.Item>Event end Time: {hours + ':' + minutes}</List.Item>
                      </>
                  }
                  <List.Item>Venue/URL: <GetVenueDetails /></List.Item>
                <List.Item>Manual Users:  {eventApiData?.manual_users.map((emp) =>
                    <Tag> {emp?.first_name + " " + emp?.last_name}</Tag>)}
                  </List.Item>

                </List>

              </Col>
              <Col style={{ marginTop: "25px" }} md={8} sm={8} xs={24}>
                {
                  eventApiData?.event_image[0] ?
                    <Image
                      src={`${Service.Server_Base_URL}/uploads/event_images/${eventApiData?.event_image[0]}`}
                    /> : null
                }
                <EventChart eventApiData={eventApiData} />
              </Col>
            </Row>
          </Card>

        </TabPane>
        <TabPane tab="Participants" key="2">
          <Card  title = "Participants">
            <div className="notification-div">
              <Row type="flex" justify="space-between">
                <Col span={24}>
                  <ParticipateEmp id={id} />
                </Col>

              </Row>
            </div>
          </Card>
        </TabPane>
        <TabPane tab="Feedback" key="3">
          <Card title="Feedback">
            <Table columns={columnsFeedback} pagination={
              {
                showSizeChanger: true,
                pageSize: ["10", "20", "30"],
                ...pagination
              }
            }
              footer={getFooterDetails}
              onChange={handleTableChange}
              dataSource={feedbackData} />
          </Card>
          {/* <Col style={{ marginTop: "25px" }}>
            <div className="cust-card-wrapper propertiescard-wrapper">
              <PieChart3D />
            </div>
          </Col> */}
        </TabPane>
        <TabPane tab="Attedence Report" key="4">
          {/* <DatePicker
            onChange={getAttedence}
            includeDates={eventApiData.event_dates.map((item) => new Date(item.start))}
            placeholderText="Select date"
          /> */}
          <Table columns={columnsAttedence}
            pagination={
              {
                showSizeChanger: true,
                total: [{ pageSize: 50 }],
                ...attedencepagination
              }
            }
            rowKey={(record) => record._id}
            expandable={{ expandedRowRender: sessionDetails }}
            footer={getAttedenceFooter}
            onChange={attedencehandleTableChange}
            dataSource={attedence} />
          <Table>

          </Table>
        </TabPane>
      </Tabs>
    </div>
  );
};
export default EventView;

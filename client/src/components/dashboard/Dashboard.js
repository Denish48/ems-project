import React, { useEffect, useState } from "react";
import { Col, Row, Card } from "antd";
import IconWithTextCard from "../IconWithTextCard/IconWithTextCard";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import Employeesrank from "../Employeesrank/Employeesrank";
import DashboardUpComing from "../DashboardUpComing/DashboardUpComing";
import { Link } from "react-router-dom";
import Service from "../../service";
import DashboardNotification from "../DashboardNotification/DashboardNotification";
import './Dashboard.css';
const localizer = momentLocalizer(moment);

const Dashboard = (props) => {
  const [calandarData, setCalandarData] = useState([]);
  const [getCount, setCount] = useState(0);
  const [upcoming, setUpcoming] = useState(0);
  const [getCompleted, setCompleted] = useState(0);
  const [getCancel, setCancel] = useState(0);

  const [previousCount, setPreviousCount] = useState(0);
  useEffect(() => {
    getCalendar();
    getEventCount();
    getupcomingCount();
    getpreviousEventsCount();
    getCancleCount();
    getCompletedCount()
  }, []);

  const getCalendar = async () => {
    try {
      // dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.event_calander,
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        const calanderData = response.data.data;
        let result = [];
        for (const event of calanderData) {
          const event_name = event.event_name;

          let dates_arr = [];
          const start_date = new Date(event.start_date);
          const end_date = new Date(event.end_date);
          let event_start_time, event_end_time;
          if (!event.allDay && event.start_time && event.end_time) {
            event_start_time = new Date(event.start_time);
            event_end_time = new Date(event.end_time);
            start_date.setHours(
              event_start_time.getHours(),
              event_start_time.getMinutes()
            );
            end_date.setHours(
              event_end_time.getHours(),
              event_end_time.getMinutes()
            );
          }

          if (event.isCustomDate && event.custom_dates && Array.isArray(event.custom_dates) && event.custom_dates?.length > 0) {
            dates_arr = event.custom_dates.map((item) => {
              const start = new Date(item);
              const end = new Date(item);
              if (!event.allDay && event.start_time && event.end_time) {
                start.setHours(event_start_time.getHours(), event_start_time.getMinutes());
                end.setHours(
                  event_end_time.getHours(),
                  event_end_time.getMinutes()
                );
              }
              return {
                title: event_name,
                start,
                end,
                allDay: event.allDay ? event.allDay : false,
                resource: event
              }
            })
          } else {
            // One day in milliseconds
            const oneDay = 1000 * 60 * 60 * 24;
            // Calculating the time difference between two dates
            const diffInTime = end_date.getTime() - start_date.getTime();
            // Calculating the no. of days between two dates
            const diffInDays = Math.round(diffInTime / oneDay) + 1;

            dates_arr = [...Array(diffInDays ? diffInDays : 1)].map((_, index, array) => {
              if (index === 0) {
                const end = new Date(start_date);
                end.setDate(start_date.getDate());
                if (event_end_time) {
                  end.setHours(
                    event_end_time.getHours(),
                    event_end_time.getMinutes()
                  );
                }
                return {
                  title: event_name,
                  start: start_date,
                  end,
                  allDay: event.allDay ? event.allDay : false,
                  resource: event
                };
              } else if (index === array.length - 1) {
                const start = new Date(start_date);
                start.setDate(start.getDate() + index);
                return {
                  title: event_name,
                  start,
                  end: end_date,
                  allDay: event.allDay ? event.allDay : false,
                  resource: event
                };
              } else {
                const start = new Date(start_date);
                start.setDate(start_date.getDate() + index);
                const end = new Date(start_date);
                end.setDate(start_date.getDate() + index);
                if (event_end_time) {
                  end.setHours(
                    event_end_time.getHours(),
                    event_end_time.getMinutes()
                  );
                }
                return {
                  title: event_name,
                  start,
                  end,
                  allDay: event.allDay ? event.allDay : false,
                  resource: event
                };
              }
            });
          }
          result = [...result, ...dates_arr];
        }
        setCalandarData(result);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  const getEventCount = async () => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.totaleventscount,
      });
      if (response.data && response.data.data) {
        setCount(response.data.data);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const getupcomingCount = async () => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.totalupcomingscount,
      });
      if (response.data && response.data.data) {
        setUpcoming(response.data.data);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const getpreviousEventsCount = async () => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.totalptivioscount,
      });
      if (response.data && response.data.data) {
        setPreviousCount(response.data.data);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const getCancleCount = async () => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.cancel_events_count,
      });
      if (response.data && response.data.data) {
        setCancel(response.data.data);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const getCompletedCount = async () => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.live_events_count,
      });
      if (response.data && response.data.data) {
        setCompleted(response.data.data);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const onSelectEvent = (event) => {
    if (event?.resource?._id) {
      const url = '/event/event-view/' + event.resource._id;
      window.open(url, '_blank').focus();
    }
  }

  return (
    <Card>
      <div className="dashboard-wrapper">
        <div className="top-div">
          <Row type="flex" justify="flex-start">
            <Col xl={6} lg={6} md={6} sm={12} xs={12}>
              <Link to="/event">
                <IconWithTextCard
                  cardColor="cyan"
                  title={getCount}
                  subTitle="Total Events"
                />
              </Link>
            </Col>
            <Col xl={6} lg={6} md={6} sm={12} xs={12}>
              <Link to="/upcoming-event">
                <IconWithTextCard
                  cardColor="orange"
                  title={upcoming}
                  subTitle="Upcoming Events"
                />
              </Link>
            </Col>
            <Col xl={6} lg={6} md={6} sm={12} xs={12}>
              <Link to="/live-event">
                <IconWithTextCard
                  cardColor="teal"
                  title={getCompleted}
                  subTitle="Live Events"
                />
              </Link>
            </Col>

            <Col xl={6} lg={6} md={6} sm={12} xs={12}>

              <IconWithTextCard
                cardColor="teall"
                title={getCancel}
                subTitle="Cancel Events"
              />
            </Col>
            <Col xl={6} lg={6} md={6} sm={12} xs={12}>
              <Link to="/previous-event">
                <IconWithTextCard
                  cardColor="teal"
                  title={previousCount}
                  subTitle="Previous Events"
                />
              </Link>
            </Col>
          </Row>
        </div>
        <div className="calandar-div">
          <Row type="flex" justify="space-between">
            <Col xl={24} lg={24} md={24} sm={24} xs={24}>
              <Calendar
                {...props}
                localizer={localizer}
                events={calandarData}
                onSelectEvent={onSelectEvent}
                popup={true}
              />
            </Col>
            <Col style={{ marginTop: "25px" }} xl={9} lg={24} md={24} sm={24} xs={24}>
              <div className="cust-card-wrapper piechart-wrapper">
                <Employeesrank />
              </div>
            </Col>
            <Col style={{ marginTop: "25px" }} xl={15} lg={24} md={24} sm={24} xs={24}>
              <div className="cust-card-wrapper tickerlist-wrapper">
                <DashboardUpComing />
              </div>
            </Col>
            {/* <Col style={{ marginTop: "25px" }} xl={24} lg={24} md={24} sm={24} xs={24}>
              <div className="cust-card-wrapper propertiescard-wrapper">
                <PieChart3D />
              </div>
            </Col> */}
          </Row>
        </div>
        <div className="notification-div">
          <Row type="flex" justify="space-between">
            <Col span={24}>
              <DashboardNotification />
            </Col>
          </Row>
        </div>
      </div>
    </Card>
  );
};

export default Dashboard;

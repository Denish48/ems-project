import React, { useState, useEffect, useRef } from 'react'
import { Input, Table, Button, Form, Card, Popconfirm, message, Modal } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux';
import Service from "../../service";
import EventTypeChart from '../EventTypeChart/EventTypeChart';

const Search = Input.Search;

const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode = inputType === 'text' ? "" : <Input />;
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{
            margin: 0,
          }}
          rules={[
            {
              required: true,
              message: `Please Input ${title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const EventTypeList = (props) => {
  const [form] = Form.useForm();
  const [eventTypeApiData, setEventTypeApiData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [seachEnabled, setSearchEnabled] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const searchRef = useRef();
  const { authUser } = useSelector(
    ({ auth }) => auth
  );
  const [reportData, setReportData] = useState(null);
  const [IsModalView, setIsModalView] = useState(false);

  const isEditing = (record) => record._id === editingKey;

  const edit = (record) => {
    form.setFieldsValue({
      event_type: '',
      ...record,
    });
    setEditingKey(record._id);
  };

  const cancel = () => {
    setEditingKey('');
  };
  const save = async (id) => {
    try {
      //update to UI

      const row = await form.validateFields();
      const newData = [...eventTypeApiData];
      const index = newData.findIndex((item) => id === item._id);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setEventTypeApiData(newData);
        let updatedRow;
        newData.map((data) => {
          if (id === data._id) {
            updatedRow = data;
          }
        });
        updatedRow = updatedRow.event_type;


        //save to database
        const params = `/${id}`;
        const response = await Service.makeAPICall({
          methodName: Service.putMethod,
          api_url: Service.eventsTypeEdit + params,
          body: {
            // event_type:{values},
            event_type: updatedRow,
            user_id: authUser?._id,
          },
        });
        setEditingKey('');
        if (response?.data?.data) {
          const msg = response.data.message;
          const index = Service.add_message(msg);
          if (index === -1) {
            message.success(msg).then(() => {
              Service.remove_message(msg);
            });
          }
        } else {
          const msg = response.data.message;
          const index = Service.add_message(msg);
          if (index === -1) {
            message.error(msg).then(() => {
              Service.remove_message(msg);
            });
          }
        }
        getEventType();
      } else {
        newData.push(row);
        setEventTypeApiData(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const columns = [
    {
      title: 'Event Type Name',
      dataIndex: 'event_type',
      key: 'event_type_master',
      render: (text, record, index) => {
        const event_type =
          record.event_type
        return <span style={{ textTransform: "capitalize" }}>{event_type}</span>;
      },
      editable: true,
    },
    {
      title: 'Actions',
      dataIndex: 'action',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <div
            style={{
              display: "flex",
              flexwrap: "wrap",
            }}
          >
            <span>
              <Button type="primary">
                <a
                  //href="javascript:;"
                  onClick={() => save(record._id)}
                >
                  Save
                </a></Button>
              <Button onClick={cancel}>Cancel</Button>
            </span>
          </div>
        ) : (
          <span>
            <div
              style={{
                display: "flex",
                flexwrap: "wrap",
              }}
            >
              <Button type="link success">
                <EditOutlined
                  style={{ fontSize: "18px" }}
                  onClick={() => edit(record)}
                  disabled={editingKey !== ""}
                />
              </Button>
                <Popconfirm
                title="Sure to delete?"
                onConfirm={() => DeleteEvent(record._id)}
              >
                <Button type="link success" title="Delete">
                  <DeleteOutlined style={{ fontSize: "18px" }} disabled={editingKey !== ""} />
                </Button>
              </Popconfirm>
              <Link type="button">
                <Button type="link success" title="View"
                  onClick={() => openModalView(record._id)}
                >
                  <EyeOutlined
                    style={{ fontSize: "18px" }}
                  />
                </Button>
              </Link>
            </div>
          </span>
        );
      }
    },
  ];

  useEffect(() => {
    getEventType()
  }, [searchText, pagination.current, pagination.pageSize])

  const getEventType = async () => {
    try {

      const reqBody = {
        pageNum: pagination.current,
        pageLimit: pagination.pageSize,
      };
      if (searchText && searchText !== "") {
        reqBody.search = searchText;
        setSearchEnabled(true);
      }
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.eventsType,
        body: reqBody,

      });
      if (response.data && response.data.data?.length > 0) {
        setPagination({
          ...pagination,
          total: response.data.metaData.totalEventTypes,
        });
        const eventType = response.data.data
        setEventTypeApiData(eventType);
      } else {
        setPagination({
          ...pagination,
          total: 0,
        });
        setEventTypeApiData([]);
        message.error(response.data.message)
        // toast("Wow so easy!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const DeleteEvent = async (id) => {
    try {
      // dispatch(showAuthLoader());
      const params = `/${id}`
      const response = await Service.makeAPICall({
        methodName: Service.deleteMethod,
        api_url: Service.eventTypeDelete + params,
        body: {
          user_id: authUser?._id
        }
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        getEventType();
        message.success(response.data.message);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
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
  const onSearch = (value) => {
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
  };

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        dataIndex: col.dataIndex,
        editing: isEditing(record)
      })

    };
  });

  const getSatisfaction = async (id) => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.employeesStatisfaction,
        body: {
          event_type_id: id
        }
      });
      if (response.data?.data?.rating_pichart) {
        const satificationData = response.data?.data?.rating_pichart
        let count = 0;
        for (const key in satificationData) {
          if (Object.hasOwnProperty.call(satificationData, key)) {
            const element = satificationData[key];
            count += element;
          }
        }
        if (count > 0) {
          const data = [
            {
              "Satisfaction": "Very Satisfied",
              "value": satificationData.very_satisfied
            },
            {
              "Satisfaction": "Satisfied",
              "value": satificationData.satisfied
            }, {
              "Satisfaction": "Good",
              "value": satificationData.good
            }, {
              "Satisfaction": "Bad",
              "value": satificationData.bad
            }, {
              "Satisfaction": "Very Bad",
              "value": satificationData.very_bad
            }
          ];
          setReportData(data);
          setIsModalView(true);
        } else {
          setReportData([]);
          setIsModalView(false);
          Service.messageInfo('No analytics found for this event type');
        }
      } else {
        setReportData([]);
        setIsModalView(false);
        Service.messageInfo('No analytics found for this event type');
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  const openModalView = (id) => {
    getSatisfaction(id);
  };

  const closeModalView = () => {
    setReportData(null);
    setIsModalView(!IsModalView);
  };

  return (
    <>
      <Card title="Event Types" className="event-list">
        <Search
          ref={searchRef}
          placeholder="Search..."
          onSearch={onSearch}
          onKeyUp={resetSearchFilter}
          style={{ width: 200 }}
        />
        <Link to="/event-type/add-event-type"> <Button type="primary" style={{ float: "right" }}>Add Event Type</Button></Link>
        <Form
          className="event-type"
          form={form}
          component={false}>
          <Table
            components={{
              body: {
                cell: EditableCell,
              },
            }}
            bordered
            dataSource={eventTypeApiData}
            columns={mergedColumns}
            // rowClassName="editable-row"
            footer={getFooterDetails}
            onChange={handleTableChange}
            pagination={
              {
                showSizeChanger: true,
                
                onChange: cancel,
                ...pagination
              }
            }
          />
        </Form>
      </Card>
      <Modal
        title="Employee's Satisfaction Analytics"
        width={800}
        visible={IsModalView}
        okText="Update"
        footer={false}
        onCancel={closeModalView}
      >
        <EventTypeChart reportData={reportData} />
      </Modal>
    </>
  )
}

export default EventTypeList


import React, { useEffect, useState, } from 'react'
import { Button, Table, Card, Popconfirm, message, } from 'antd';
import Service from "../../service";
import {
  DeleteOutlined,
} from "@ant-design/icons";
import {
  showAuthLoader,
  hideAuthLoader,
} from "../../appRedux/actions/Auth";
import { Link } from 'react-router-dom';
import { useDispatch } from "react-redux";

const SurveyFB = () => {
  const [feedbackData, setFeedbackData] = useState([])
  const [searchText, setSearchText] = useState("");
  const [seachEnabled, setSearchEnabled] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const dispatch = useDispatch();

  useEffect(() => {
    getElevateFormList();
  }, [searchText, pagination.current, pagination.pageSize]);
  
  const getElevateFormList = async () => {
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
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.elevateFormList,
        body: reqBody,

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

  const DeleteElevateForm = async (id) => {
    try {
      dispatch(showAuthLoader());
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.deleteMethod,
        api_url: Service.deleteElevateFormById + params,
      });
      dispatch(hideAuthLoader());

      if (response.data && response.data.data) {
        getElevateFormList();
      } else {
        message.error(response.data.message)
      }
    } catch (error) {
      dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  
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
  const columns = [

    {
      title: 'Forms',
      dataIndex: 'name',
      key: 'name',
      render: (text, record, index) => {

        const name = text?.charAt(0).toUpperCase() + text?.slice(1);
        return <Link type="button" to={`/elevate-forms/edit/${record._id}`}>{name}</Link>
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
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => DeleteElevateForm(record._id)}
          >
            <Button type="link success" title="Delete">
              <DeleteOutlined style={{ fontSize: "18px" }} />
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (

    <Card title="Elevate Forms">
      <Link to="/elevate-forms/add">
        <Button type="primary" style={{ float: "right" }}>
          Create Elevate Form
        </Button>
      </Link>
      <Link to="/elevate-forms/surveys">
        <Button type="primary" style={{ float: "right", marginRight: '10px' }}>
          Survey Forms
        </Button>
      </Link>

      <Table columns={columns} pagination={
        {
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "30"],
          ...pagination
        }
      }
        footer={getFooterDetails}

        onChange={handleTableChange} dataSource={feedbackData} />
    </Card>
  )
}

export default SurveyFB

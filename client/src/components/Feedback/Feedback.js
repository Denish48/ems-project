import React, { useEffect, useState, useRef } from 'react'
import { Table, Card } from 'antd';
import Service from "../../service";

const Feedback = () => {
  const [feedbackData, setFeedbackData] = useState([])
  const searchRef = useRef();

  const [searchText, setSearchText] = useState("");
  const [seachEnabled, setSearchEnabled] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  useEffect(() => {
    getFeedback();
  }, [searchText, pagination.current, pagination.pageSize]);
  // const onSearch = (value) => {
  //   setSearchText(value);
  //   setPagination({ ...pagination, current: 1 });
  // };
  const handleTableChange = (page, filters, sorter) => {
    setPagination({ ...pagination, ...page });
  };
  const getFeedback = async () => {
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
        api_url: Service.feedbackandsurveyList,
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
  const getFooterDetails = () => {
    return (
      <label>
        Total Records Count is {pagination.total > 0 ? pagination.total : 0}
      </label>
    )
  }


}

export default Feedback

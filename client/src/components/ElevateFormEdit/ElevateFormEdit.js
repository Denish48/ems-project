import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactDOM from 'react-dom';
import { Input, Button, Form, Card, Modal, message, Rate } from "antd";
import { useDispatch, useSelector } from 'react-redux';
import Service from "../../service";
import {
    showAuthLoader,
    hideAuthLoader,
} from "../../appRedux/actions/Auth";

// import { ReactFormBuilder } from 'react-form-builder2';
// import 'react-form-builder2/dist/app.css';
import './ElevateFormEdit.css';

import $ from "jquery";
window.jQuery = $;
window.$ = $;

require("jquery-ui-sortable");
require("formBuilder");

const EditSurvey = (props) => {
    const id = props.match.params.id;
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const { authUser } = useSelector(
        ({ auth }) => auth
    );
    const [IsModalView, setIsModalView] = useState(false);
    const [formData, setFormData] = useState(null);
    const [name, setFormName] = useState(null);

    const fb = useRef();

    const onCancel = () => {
        if (props.history.length > 1) {
            props.history.goBack();
        } else {
            props.history.push('/elevate-forms');
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

    const handleSubmit = async (questions, name) => {
        try {
            dispatch(showAuthLoader());
            const params = `/${id}`;
            const response = await Service.makeAPICall({
                methodName: Service.postMethod,
                api_url: Service.editElevateForm + params,
                body: {
                    name,
                    questions,
                    user_id: authUser?._id,
                },
            });
            dispatch(hideAuthLoader());
            if (response.data && response.data.data) {
                props.history.push("/elevate-forms");
            }
        } catch (e) {
            dispatch(hideAuthLoader());
            console.log("err occured:" + e);
        }
    };

    const onSave = (e, values) => {
        if (values) {
            setFormData(JSON.parse(values));
            setIsModalView(true);
        }
    }

    const setSurveyFormName = (values) => {
        handleSubmit(formData, values?.name);
    }

    const options = {
        stickyControls: {
            enable: true,
        },
        sortableControls: true,
        onSave,
        disableFields: ['autocomplete', 'date', 'file', 'hidden',],
        fields: [{
            label: 'Star Rating',
            attrs: {
                type: 'starRating'
            },
            icon: '🌟'
        }],
        templates: {
            starRating: function (fieldData) {
                return {
                    field: '<span id="' + fieldData.name + '">',
                    onRender: function () {
                        ReactDOM.render(
                            <Rate />,
                            document.getElementById(fieldData.name)
                        );
                    }
                };
            }
        },
        inputSets: [
            {
                label: 'User Details',
                name: 'user-details', // optional - one will be generated from the label if name not supplied
                showHeader: true, // optional - Use the label as the header for this set of inputs
                fields: [
                    {
                        type: 'text',
                        label: 'First Name',
                        className: 'form-control'
                    },
                    {
                        type: 'text',
                        label: 'Last Name',
                        className: 'form-control'
                    },
                    {
                        type: 'textarea',
                        label: 'Description',
                        className: 'form-control'
                    }
                ]
            },
            {
                label: 'Event Statisfaction',
                fields: [
                    {
                        "type": "starRating",
                        "required": false,
                        "label": "Rating",
                        "name": "statisfaction-starRating-0",
                        "access": false
                    },
                ]
            },
            {
                label: 'User Agreement',
                fields: [
                    {
                        type: 'header',
                        subtype: 'h2',
                        label: 'Terms &amp; Conditions',
                        className: 'header'
                    },
                    {
                        type: 'paragraph',
                        label: 'Lorem ipsum',
                    },
                    {
                        type: 'checkbox-group',
                        label: 'Do you agree to the terms and conditions?',
                    }
                ]
            },
            {
                label: 'Anonymous Feedback',
                fields: [
                    {
                        type: 'checkbox-group',
                        label: 'Do you want to submit as anonymous?',
                        name: "anonymous-feedback-0",
                    }
                ]
            }
        ],
    };

    const getElevateFormsById = useCallback(async () => {
        try {
            const params = `/${id}`;
            const response = await Service.makeAPICall({
                methodName: Service.getMethod,
                api_url: Service.elevateFormById + params,
            });
            if (response.data?.data?.questions.length > 0) {
                const questions = response.data?.data?.questions
                setFormData(questions);
                setFormName(response.data?.data?.name);
                $(fb.current).formBuilder({ formData: questions, ...options });
            } else {
                message.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
        }
    }, [id]);

    useEffect(() => {
        getElevateFormsById();
    }, [getElevateFormsById])

    return (
        <>
            <Card title={
                <div>
                    <div style={{ padding: 5 }}>
                        <Button onClick={onCancel} style={{ marginBottom: 0 }}>Back</Button>
                    </div>
                </div>
            }>
                <div
                    id="fb-editor"
                    ref={fb}
                />
            </Card>
            <Modal
                title="Elevate Form Template"
                width={800}
                visible={IsModalView}
                okText="Update"
                onCancel={() => setIsModalView(false)}
                footer={false}
            >
                <Form
                    layout="vertical"
                    {...formItemLayout}
                    form={form}
                    onFinish={setSurveyFormName}
                    initialValues={{ name: name }}
                >
                    <Form.Item
                        label="Elevate Form Template Name"
                        name="name"
                        rules={[
                            {
                                required: true,
                                message: "Please input your Event Name",
                            },
                        ]}
                    >
                        <Input size="large" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit">Submit</Button>
                </Form>
            </Modal>
        </>
    );
};

export default EditSurvey;

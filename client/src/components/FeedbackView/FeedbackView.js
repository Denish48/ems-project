import React, { useEffect, useRef, useCallback } from "react";
import ReactDOM from 'react-dom';
import { Button, Card, message, Rate } from "antd";
import Service from "../../service";

import './FeedbackView.css';

import $ from "jquery";
window.jQuery = $;
window.$ = $;

require("jquery-ui-sortable");
require("formBuilder");
require("formBuilder/dist/form-render.min.js");

const EditSurvey = (props) => {
    const id = props.match.params.id;
    const fb = useRef();

    const onCancel = () => {
        if (props.history.length > 1) {
            props.history.goBack();
        } else {
            props.history.push('/event');
        }
    };

    const options = {
        stickyControls: {
            enable: true,
        },
        sortableControls: true,
        disableFields: ['autocomplete', 'date', 'file', 'hidden',],
        fields: [{
            label: 'Star Rating',
            attrs: {
                type: 'starRating'
            },
            icon: '🌟',
        }],
        templates: {
            starRating: function (fieldData) {
                return {
                    field: '<div id="' + fieldData.name + '">',
                    onRender: function () {
                        let props = {};
                        if (typeof fieldData?.value === 'number') {
                            props.value = fieldData?.value;
                        }
                        ReactDOM.render(
                            <Rate {...props} />,
                            document.getElementById(fieldData.name)
                        );
                    }
                };
            }
        },
    };

    const feedbackById = useCallback(async () => {
        try {
            const params = `/${id}`;
            const response = await Service.makeAPICall({
                methodName: Service.getMethod,
                api_url: Service.feedbackById + params,
            });
            if (response.data?.data?.length > 0) {
                let questions = response.data?.data[0]?.event_form?.questions;
                let answers;
                if (typeof response.data?.data[0]?.answers[0] === 'object') {
                    answers = response.data?.data[0]?.answers[0];
                } else if (typeof response.data?.data[0]?.answers[0] === 'string') {
                    answers = JSON.parse(response.data?.data[0]?.answers[0]);
                }
                if (questions?.length > 0 && answers) {
                    questions = questions.map((item) => {
                        for (const key in answers) {
                            if (Object.hasOwnProperty.call(answers, key)) {
                                if (item.name === key) {
                                    const element = answers[key];
                                    if (item.type === "text" || item.type === "textarea") {
                                        item.value = element;
                                    }
                                    if (item.type === "radio-group") {
                                        item.values = item.values.map(optionItem => {
                                            return {
                                                ...optionItem,
                                                selected: optionItem.label === element
                                            };
                                        })
                                    }
                                    if (item.type === "checkbox-group") {
                                        item.values = item.values.map(optionItem => {
                                            let isSelected = false;
                                            for (const key in element) {
                                                if (Object.hasOwnProperty.call(element, key)) {
                                                    const ele = element[key];
                                                    if (!isSelected) {
                                                        isSelected = optionItem.label === key && ele;
                                                    }
                                                }
                                            }
                                            return {
                                                ...optionItem,
                                                selected: isSelected
                                            };
                                        })
                                    }
                                    if (item.type === "starRating") {
                                        item.value = element;
                                    }
                                }
                            }
                        }
                        return item;
                    });

                    $(fb.current).formRender({
                        formData: questions,
                        ...options
                    });

                    const disaableBtn = document.querySelectorAll('#fb-editorr .form-control');
                    disaableBtn.forEach(el => {
                        el.setAttribute('readonly', 'readonly');
                    });
                } else {
                    onCancel();
                }
                // $('.rendered-form').children(':input').attr('disabled', 'disabled');
                // $(fb.current).toggle();
                // $(fbRender.current).toggle();
                // $(userForm.current).formRender({
                //     dataType: 'json',
                //     formData: $(fb.current).formBuilder('getData', 'json')
                // });
            } else {
                message.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
        }
    }, [id]);
    useEffect(() => {
        feedbackById();
    }, [feedbackById]);
    const onNextPreviousView = async (flag) => {
        try {

            const params = `/${id}`;
            const query = `next=${flag}`
            const response = await Service.makeAPICall({
                methodName: Service.getMethod,
                api_url: Service.feedbackById + params,
                params: query
            });
            if (response.data && response.data.data) {
                const feed = response.data.data;

            } else {
                message.error("Something went wrong")
            }
        } catch (error) {
            console.log(error);
        }

    }

    return (
        <>
            <Card title={
                <div>
                    <div style={{ padding: 5 }}>
                        <Button onClick={onCancel} style={{ marginBottom: 0 }}>Back</Button>
                        {onNextPreviousView('1') ?

                            <Button type="primary" onClick={() => onNextPreviousView('1')} style={{ float: "right" }}>
                                Next
                            </Button>
                            :
                            <>
                                <Button type="primary" onClick={() => onNextPreviousView('0')} style={{ marginBottom: 0 }}>
                                    previous
                                </Button>
                                <Button type="primary" onClick={() => onNextPreviousView('1')} style={{ float: "right" }}>
                                    Next
                                </Button>
                            </>}
                    </div>
                </div>
            }>
                {/* <Button type="primary" onClick={() => onNextPreviousView('0')} style={{ padding: 5 }}>
                    previous
                </Button> */}


                <div
                    id="fb-editorr"
                    ref={fb}
                />
            </Card>

        </>
    );
};

export default EditSurvey;

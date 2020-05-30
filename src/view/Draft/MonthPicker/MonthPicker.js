import React, { Component } from 'react';
import Textarea from 'react-textarea-autosize';
import  MultiSelectReact  from 'multi-select-react';
import TextField from '@material-ui/core/TextField';
import  * as Utils from '../../../common/utilSvc'; 
import './MonthPicker.css';
import { isNull, isNullOrUndefined } from 'util';

class MonthPicker extends React.Component {

    selectedOptionsStyles = {
        color: "white",
        backgroundColor: "rgb(117, 106, 214)",
        borderRadius:"20px",
        fontSize:'0.6em',
        padding:'5px',
        maxWidth: '92%',
        wordWrap: 'break-word'
    };
    optionsListStyles = {
        backgroundColor: "darkcyan",
        color: "white",

    };

    constructor(props) {
      //updateMonth,date
      super(props);
      this.state={
        monthList: [],
        newDate: JSON.parse(JSON.stringify(props.date))
      }
      this.monthClicked = this.monthClicked.bind(this);
      this.selectedMonthBadgeClicked = this.selectedMonthBadgeClicked.bind(this);
      this.validateMonth = this.validateMonth.bind(this);
      this.generateMonthList = this.generateMonthList.bind(this);
      this.handleChange = this.handleChange.bind(this);
    }

    validateMonth(monthList){
        let selectedMonth = -1;
        for(let i=1; i<monthList.length; i++){
            if(monthList[i].value == true)
            {
                selectedMonth = monthList[i].id;
                break;
            }
        }
        let newDate = this.state.newDate;
        if(selectedMonth == -1){
            let prevMonth  = newDate.month;
            selectedMonth = null;
            monthList[0].value = true;
        }
        newDate.month = selectedMonth;      
        this.setState({
            monthList: monthList,
            newDate: newDate
        });
        this.props.onChange(this.state.newDate);
    }

    handleChange(event, type) {

        var shouldUpdate = true;
        var lastChar = event.target.value[event.target.value.length-1];
        if(lastChar=='\n' || lastChar=='\t'){
            shouldUpdate=false;
        }
        if((!Utils.validateNumber(event.target.value) || event.target.value.length > 8) && type=='year'){
            shouldUpdate = false;
        }

        if(shouldUpdate){
            if(type == 'year'){
                let date = this.state.newDate;
                date.year = Number(event.target.value);
                this.setState({
                    newDate:date
                });
                this.props.onChange(this.state.newDate);
            }
            
        }
      }

    generateMonthList(){
        let months = ['Jan','Feb','March','April','May','June','July','Aug','Sep','Oct','Nov','Dec'];
        let monthList = [];
        monthList.push({
            id:-1, value:false, label:'None'   
        });
        for(let i=0; i<12; i++){
            let value = false;
            if(this.props.date.month == i)
                value = true;
            monthList.push({
                id:i, value:value, label:months[i]   
            });
        }
        if(isNullOrUndefined(this.props.date.month)){
            monthList[0].value = true;
        }
        this.setState({
            monthList:monthList
        });
    }


    monthClicked(monthList) {
        this.validateMonth(monthList);
    }

    selectedMonthBadgeClicked(monthList) {
        this.validateMonth(monthList);
    }

    componentDidMount(){
        this.generateMonthList();
    }

    render() {
      return (
        <div style={{display: 'flex', flexWrap: 'wrap'}}>
            <div style={{marginRight:'20px', width:'150px'}}>
                <div className="monthPickerHeader">Month</div>
                <div style={{width:'80%'}}>
                    <MultiSelectReact 
                            options={this.state.monthList}
                            optionClicked={this.monthClicked.bind(this)}
                            selectedBadgeClicked={this.selectedMonthBadgeClicked.bind(this)}
                            selectedOptionsStyles={this.selectedOptionsStyles}
                            optionsListStyles={this.optionsListStyles} 
                            isTextWrap={false} 
                            isSingleSelect={true}
                            />
                </div>
            </div>
            <div>
            <div className="monthPickerHeader">Year</div>
                <div>
                    <form>
                        <label>
                            <TextField 
                                type="number"
                                multiline
                                value={String(this.state.newDate.year)}
                                onChange={(e) => { this.handleChange(e,"year")}}
                                rowsMax="12"
                                rows="1"
                                style={{
                                    background: 'transparent',
                                    textColor: 'black',
                                    width:'200px'
                                    }}/>
                        </label>
                    </form>
                </div>
            </div>
        </div>
      );
    }
  }
  export default MonthPicker;
  
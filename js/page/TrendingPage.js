/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *趋势界面
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {StyleSheet, Text, View, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, DeviceEventEmitter} from 'react-native';
import {connect} from 'react-redux';
import actions from '../action/index';
import Toast from 'react-native-easy-toast'
import TrendingItem from '../common/TrendingItem';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Foundation from 'react-native-vector-icons/Foundation';
import {
    createMaterialTopTabNavigator,
    createAppContainer
} from "react-navigation";
import NavigationBar from "../common/NavigationBar";
import AntDesign from "react-native-vector-icons/AntDesign";
const URL = 'https://github.com/trending/';
import TrendingDialogs,{TimeSpans} from "../common/TrendingDialog"
import NavigationUtil from "../navigator/NavigationUtil";
import FavoriteUtil from "../util/FavoriteUtil";
import {FLAG_STORAGE} from "../expand/dao/DataStore";
import FavoriteDao from "../expand/dao/FavoriteDao";
import EventBus from "react-native-event-bus";
import EventTypes from "../util/EventTypes";
import {FLAG_LANGUAGE} from "../expand/dao/LanguageDao";
import ArrayUtil from "../util/ArrayUtil";
//const QUERY_STR = '&sort=stars'; //按照点赞数来排序
//const TITLE_COLOR = '#2a8ffa';
const EVENT_TYPE_TIME_SPAN_CHANGE =  'EVENT_TYPE_TIME_SPAN_CHANGE';
const favoriteDao = new FavoriteDao(FLAG_STORAGE.flag_trending);
type Props = {};
class TrendingPage extends Component<Props> {
    //默认显示今天
    // timeSpan:TimeSpans[0];

    //顶部导航动态显示
    constructor(props){
        super(props);
        console.disableYellowBox = true; //取消Warning界面
     //   this.tabNames =['All','C','C#','PHP','JavaScript'];
        this.state = {
            //默认显示今天
            timeSpan: TimeSpans[0],
        };
        const {onLoadLanguage} = this.props;
        onLoadLanguage(FLAG_LANGUAGE.flag_language);
        this.preKeys = [];

    }
    _genTabs(){
        const tabs={};
        const {keys,theme} = this.props;
        this.preKeys = keys;
        keys.forEach((item,index)=>{
            //判断是否选中
            if(item.checked){
                tabs[`tab${index}`] = {
                    screen: props => <TrendingTabPage {...props} timeSpan={this.state.timeSpan} tabLabel={item.name} theme={theme}/>,  //传递数据
                    navigationOptions:{
                        title:item.name
                    }
                }
            }

        });
        return tabs;
    }


    //定义趋势标题样式
    renderTitleView(){
        return <View>
            <TouchableOpacity
                underlayColor='transparent'
                onPress={() => this.dialog.show()}>
                <View style={{flexDirection: 'row',alignItems:'center'}}>
                    <Text style={{
                        fontSize:18,
                        color:'#FFFFFF',
                        fontWeight: '400'
                    }}>趋势  {this.state.timeSpan.showText}</Text>
                    <MaterialIcons
                        name={'arrow-drop-down'}
                        size={22}
                        style={{color: 'white',}}

                    />
                </View>
            </TouchableOpacity>
        </View>
    }


    //进行优化效率：根据需要选择是否重新创建TabNavigator，通常需要改变才能够创建
    //这里需要动态创建


    //对标题tabNavigation进行优化，防止变更趋势时间的时候，在一次被动态加载
    //优化效率：根据需要选择是否重新创建建TabNavigator，通常tab改变后才重新创建
    //还在测试中
    _tabNav(){
        const {theme} = this.props;
        if (theme !== this.theme || !this.tabNav || !ArrayUtil.isEqual(this.preKeys,this.props.keys)){
            this.theme = theme;
            this.tabNav = createAppContainer(createMaterialTopTabNavigator(
                this._genTabs(),{
                    tabBarOptions:{
                        tabStyle:styles.tableStyle,
                        upperCaseLabel:false, //是否使用标签大写
                        scrollEnabled:true, //是否支持选项卡可以滚动
                        style:{
                            backgroundColor: theme.themeColor, //配置tab的背景色
                            height:40 , //设置固定的高度
                        },
                        indicatorStyle:styles.indicatorStyle, //指示器的颜色
                        labelStyle:styles.labelStyle, //文字的样式

                    },
                    lazy: true //启用懒加载
                }
            ));
        }
        return this.tabNav;
    }


    // //react-navigation3.x的特性
    // _tabNavigator(){
    //     const TabNavigator = createMaterialTopTabNavigator(
    //         this._genTabs(),{
    //             tabBarOptions:{
    //                 tabStyle:styles.tableStyle, //是否使用相关样式
    //                 upperCaseLabel:false, //是否使用标签大写
    //                 scrollEnabled:true, //是否支持选项卡可以滚动
    //                 styles:{
    //                     backgroundColor:"#2a8ffa",
    //                     height:40,  //设置固定的高度
    //                 },
    //                 indicatorStyle:styles.indicatorStyle, //指示器的颜色
    //                 labelStyle:styles.labelStyle, //文字样式
    //             }
    //         });
    //     return createAppContainer(TabNavigator);
    // }


    //获取右边按钮(搜索按钮)
    getRightButton(){
        return <View style={{flexDirection: 'row'}}>
            <TouchableOpacity
                onPress={() => {
                }}
            >
                <View style={{padding:5,marginRight: 10}}>
                    <Foundation
                        name={'align-right'}
                        size={21}
                        style={{color:'white'}}
                    />
                </View>
            </TouchableOpacity>
        </View>
    }

    onSelectTimeSpan(tab) {
        this.dialog.dismiss();
        this.setState({
            timeSpan: tab
        });
        DeviceEventEmitter.emit(EVENT_TYPE_TIME_SPAN_CHANGE,tab);
    }

    renderTrendingDialog(){
        return <TrendingDialogs
            ref={dialog => this.dialog=dialog}
            onSelect={tab => this.onSelectTimeSpan(tab)}
        />
    }

    render() {
        const {keys,theme} = this.props;
        let statusBar={
            backgroundColor: theme.themeColor,
            barStyle: 'light-content', //不设置也行
        };
        let navigationBar = <NavigationBar
            titleView={this.renderTitleView()}
            statusBar={statusBar}
            style={theme.styles.navBar}
            rightButton={this.getRightButton()}
        />;

        const TabNavigator = keys.length ? this._tabNav(): null;
        // const TabNavigator = this._tabTopNavigator();
        return <View style={{flex: 1}}>
            {navigationBar}
            {TabNavigator && <TabNavigator/>}
            {this.renderTrendingDialog()}
        </View>

    }
}


//订阅
const mapTrendingStateToProps = state => ({
    keys: state.language.languages,
    theme: state.theme.theme,
});
const mapTrendingDispatchToProps = dispatch => ({
    onLoadLanguage: (flag) => dispatch(actions.onLoadLanguage(flag))
});
//注意：connect只是个function，并不应定非要放在export后面
export default connect(mapTrendingStateToProps, mapTrendingDispatchToProps)(TrendingPage);



const pageSize = 10;//设为常量，防止修改，每次加载的列表数
class TrendingTab extends Component<Props> {
    constructor(props){
        super(props);
        const {tabLabel,timeSpan} = this.props;
        this.storeName = tabLabel;
        this.timeSpan = timeSpan;
    }
    componentDidMount() {
        this.loadData();
        this.timeSpanChangeListener = DeviceEventEmitter.addListener(EVENT_TYPE_TIME_SPAN_CHANGE,(timeSpan) =>{
            this.timeSpan  = timeSpan;
            this.loadData();
        });

        EventBus.getInstance().addListener(EventTypes.favoriteChanged_trending, this.favoriteChangeListener = () => {
            this.isFavoriteChanged = true;
        });
        EventBus.getInstance().addListener(EventTypes.bottom_tab_select, this.bottomTabSelectListener = (data) => {
            if (data.to === 1 && this.isFavoriteChanged) {
                this.loadData(null, true);
            }
        })
    }

    //事件加载完成的时候
    componentWillUnmount() {
        if (this.timeSpanChangeListener){
            this.timeSpanChangeListener.remove();
        }
        EventBus.getInstance().removeListener(this.favoriteChangeListener);
        EventBus.getInstance().removeListener(this.bottomTabSelectListener);
    }

    loadData(loadMore,refreshFavorite){
        const {onRefreshTrending,onLoadMoreTrending,onFlushTrendingFavorite} = this.props;
        const store = this._store();
        const url = this.genFetchUrl(this.storeName);
        if (loadMore){
            //下拉加载更多
            onLoadMoreTrending(this.storeName, ++store.pageIndex,pageSize,store.items,favoriteDao,callback=>{
                this.refs.toast.show('没有更多了');
            })
        } else if(refreshFavorite){
            onFlushTrendingFavorite(this.storeName, store.pageIndex, pageSize, store.items, favoriteDao);
            this.isFavoriteChanged = false;
        } else{
            //否则上拉刷新
            onRefreshTrending(this.storeName,url,pageSize,favoriteDao)
        }

    }

    /**
     * 获取与当前页面有关的数据
     * @returns {*}
     * @private
     */
    _store() {
        const {trending} = this.props;
        let store = trending[this.storeName];
        if (!store) {
            store = {
                items: [],
                isLoading: false,
                projectModels: [],//要显示的数据
                hideLoadingMore: true,//默认隐藏加载更多
            }
        }
        return store;
    }

    genFetchUrl(key) {
        //url加入了trending页面后带的参数
        return URL + key + '?' + this.timeSpan.searchText;
    }

    renderItem(data){
        const item = data.item;
        const {theme} = this.props;
        return <TrendingItem
            projectModel = {item}
            theme = {theme}
            onSelect={(callback)=>{
                NavigationUtil.goPage({
                    theme,
                    projectModel: item,
                    flag:FLAG_STORAGE.flag_trending,
                    callback,
                },'DetailPage');
            }}
            onFavorite={(item,isFavorite) => FavoriteUtil.onFavorite(favoriteDao,item,isFavorite,FLAG_STORAGE.flag_trending)}
        />
    }

    genIndicator(){
        return this._store().hideLoadingMore ? null :
            <View style={styles.indicatorContainer}>
                <ActivityIndicator
                    style={styles.indicator}
                />
                <Text>正在加载更多</Text>
            </View>
    }

    render() {
        const {theme} = this.props;
        let store = this._store();
        return (
            <View style={styles.container}>
                <FlatList
                    data={store.projectModels}
                    renderItem={data=>this.renderItem(data)}
                    keyExtractor={item=>""+ (item.item.id || item.item.fullName)}
                    refreshControl={
                        <RefreshControl
                            title={'Loading'}
                            titleColor={theme.themeColor}
                            colors={[theme.themeColor]}
                            refreshing={store.isLoading}
                            onRefresh={() => this.loadData()}
                            tintColor={theme.themeColor}
                        />
                    }

                    //进行相应的优化，减少加载时间，避免重复更新

                    //这里是解决下拉加载重复更新，每次只显示自定义pageSize，我这里是一次加载10个数据，
                    //下拉加载更多的优化
                    ListFooterComponent={()=> this.genIndicator()}
                    onEndReached={() => {
                        console.log('---onEndReached----');
                        setTimeout(() => {
                            if (this.canLoadMore) {//fix 滚动时两次调用onEndReached https://github.com/facebook/react-native/issues/14015
                                this.loadData(true);
                                this.canLoadMore = false;
                            }
                        }, 100);
                    }}
                    onEndReachedThreshold={0.5}
                    onMomentumScrollBegin={() => {
                        this.canLoadMore = true; //fix 初始化时页调用onEndReached的问题
                        console.log('---onMomentumScrollBegin-----')
                    }}
                />
                {/*弹出Toast*/}
                <Toast
                    ref={'toast'}
                    position={'center'}
                />

            </View>
        );
    }

}
const mapStateToProps = state => ({
    trending: state.trending
});
const mapDispatchToProps =  dispatch => ({
    onRefreshTrending:(storeName,url,pageSize,favoriteDao)=> dispatch(actions.onRefreshTrending(storeName,url,pageSize,favoriteDao)),
    onLoadMoreTrending: (storeName,pageIndex,pageSize,items,favoriteDao,callback) =>  dispatch(actions.onLoadMoreTrending(storeName,pageIndex,pageSize,items,favoriteDao,callback)),
    onFlushTrendingFavorite: (storeName, pageIndex, pageSize, items, favoriteDao) => dispatch(actions.onFlushTrendingFavorite(storeName, pageIndex, pageSize, items, favoriteDao)),
});

//创建函数
const TrendingTabPage = connect(mapStateToProps,mapDispatchToProps)(TrendingTab);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    welcome: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
    },
    instructions: {
        textAlign: 'center',
        color: '#333333',
        marginBottom: 5,
    },
    tableStyle:{
        // minWidth: 50
        padding:0,
    },
    indicatorStyle:{
        height:2,
        backgroundColor: '#F5FCFF',
    },
    labelStyle:{
        fontSize:13,
        margin:0,
    },
    indicatorContainer: {
        alignItems: "center"
    },
    indicator: {
        color: 'red',
        margin: 10
    }
});

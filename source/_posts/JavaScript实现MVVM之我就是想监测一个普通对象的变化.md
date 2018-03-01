---
title: JavaScript实现MVVM之我就是想监测一个普通对象的变化111
date: 2017-07-20 10:07:42
tags: MVVM
---
```
//定义一个变化通知的回调
var callback=function(newVal,oldVal){
alert(newVal+'-----'+oldVal)
}
//定义一个对象作为数据模型
var data={
  a:200,
  level1:{
    b:'str',
    c:[1,2,3],
    level2:{
     d:20
    }
  }
}
// 实例化一个检测对象，去检测数据，并在数据发生变化的时候做出响应
var Jsonob(data,callback)
```
上面代码中，我们定义了一个 callback 回调函数，以及一个保存着普通json对象的变量 data ，最后实例化了一个 监测对象 ，对 data 进行变化监测，当变化发生的时候，执行给定的回调进行必要的变化通知，这样，我们通过一些手段就可以达到数据绑定的效果。
Object.defineProperty
------
ES5把属性分成两种，一种是 数据属性， 一种是 访问器属性，我们可以使用 Object.defineProperty() 去定义一个数据属性或访问器属性。如下代码：
```
var obj = {};

obj.name = 'hcy';

```
上面的代码我们定义了一个对象，并给这个对象添加了一个属性 name，值为 ‘hcy’，我们也可以使用 Object.defineProperty() 来给对象定义属性，上面的代码等价于：
```
var obj = {};
Object.defineProperty(obj,'name',{
value: 'fengya',//属性的值
writable: true ,//是否可写
enumerable: true, //是否可以通过for in 枚举
configurable: true //是否可用delete删除
})

```
这样我们就使用 Object.defineProperty 给对象定义了一个属性，这样的属性就是数据属性，我们也可以定义访问器属性
```
    var obj = {};
    var initNum=20
    Object.defineProperty(obj,'age',{
        get: function(){
            return 20;
        },
        set:function(newVal){
            initNum +=newVal;
        }
    })

```
访问器属性允许你定义一对儿 getter/setter ，当你读取属性值的时候底层会调用 get 方法，当你去设置属性值的时候，底层会调用 set 方法
知道了这个就好办了，我们再回到最初的问题上面，如何检测一个普通对象的变化，我们可以这样做：
>遍历对象的属性，把对象的属性都使用 Object.defineProperty 转为 getter/setter ，这样，当我们修改一些值得时候，就会调用set方法，然后我们在set方法里面，回调通知，不就可以了吗，来看下面的代码：


```
// index.js
const OP = Object.prototype;

export class Jsonob{
    constructor(obj, callback){
        if(OP.toString.call(obj) !== '[object Object]'){
            console.error('This parameter must be an object：' + obj);
        }
        this.$callback = callback;
        this.observe(obj);
    }
    
    observe(obj){
        Object.keys(obj).forEach(function(key, index, keyArray){
            var val = obj[key];
            Object.defineProperty(obj, key, {
                get: function(){
                    return val;
                },
                set: (function(newVal){
                    this.$callback(newVal);
                }).bind(this)
            });
            
            if(OP.toString.call(obj[key]) === '[object Object]'){
                this.observe(obj[key]);
            }
            
        }, this);
        
    }
}
```
上面代码采用ES6编写，index.js文件中导出了一个 Jsonob 类，constructor构造函数中，我们保证了传入的对象是一个 {} 或 new Object() 生成的对象，接着缓存了回调函数，最后调用了原型下的 observe 方法。
observe方法是真正实现监测属性的方法，我们使用 Object.keys(obj).forEach 循环obj所有可枚举的属性，使用 Object.defineProperty 将属性转换为访问器属性，然后判断属性的值是否是一个对象，如果是对象的话再进行递归调用，这样一来，我们就能保证一个复杂的普通json对象中的属性以及值为对象的属性的属性都转换成访问器属性。
最后，在 Object.defineProperty 的 set 方法中，我们调用了指定的回调，并将新值作为参数进行传递。
接下来我们编写一个测试代码，去测试一下上面的代码是否可以正常使用

```
            var Jsonob = Jsonob.Jsonob;
            
            var callback = function(newVal){
                alert(newVal);
            };
            
            var data = {
                a: 200,
                level1: {
                    b: 'str',
                    c: [1, 2, 3],
                    level2: {
                        d: 90
                    }
                }
            }
            
            var j = new Jsonob(data, callback);
            
            data.a = 250;
            data.level1.b = 'sss';
            data.level1.level2.d = 'msn';
```
上面代码，很接近我们文章开头要实现的目标。我们定义了回调(callback)和数据模型(data)，在回调中我们使用 alert 函数弹出新值，然后创建了一个监测实例并把数据和回调作为参数传递过去，然后我们试着修改data对象相面的属性以及子属性，看看代码是否按照我们预期的工作
我们在检测到变化并通知回调时，只传递了一个新值(newVal)，但有的时候我们也需要旧值，但是以现在的程序来看，我们还无法传递旧值，所以我们要想办法。大家仔细看上面 index.js 中forEach循环里面的代码，有这样一段：
```
    var val = obj[key];
    Object.defineProperty(obj, key, {
        get: function(){
            return val;
        },
        set: (function(newVal){
            this.$callback(newVal);
        }).bind(this)
    });
```

实际上，val 变量所存储的，就是旧值，我们不妨把上面的代码修改成下面这样：
```
var oldVal = obj[key];
Object.defineProperty(obj, key, {
    get: function(){
        return oldVal;
    },
    set: (function(newVal){
        if(oldVal !== newVal){
            if(OP.toString.call(newVal) === '[object Object]'){
                this.observe(newVal);
            }
            this.$callback(newVal, oldVal);
            oldVal = newVal;
        }
        
    }).bind(this)
});
```
我们将原来的 val 变量名字修改成 oldVal ，并在set方法中进行了更改判断，仅在值有更改的情况下去做一些事，当值有修改的时候，我们首先判断了新值是否是类似 {} 或 new Object() 形式的对象，如果是的话，我们要调用 this.observe 方法去监听一下新设置的值，然后在把旧值传递给回调函数之后更新一下旧值。

```
  var Jsonob = Jsonob.Jsonob;
            
            var callback = function(newVal, oldVal){
                alert('新值：' + newVal + '----' + '旧值：' + oldVal);
            };
            
            var data = {
                a: 200,
                level1: {
                    b: 'str',
                    c: [1, 2, 3],
                    level2: {
                        d: 90
                    }
                }
            }
            
            var j = new Jsonob(data, callback);
            
            data.a = 250;
            data.a = 260;
```
这样，我们完成了最最基本的普通对象变化监测库
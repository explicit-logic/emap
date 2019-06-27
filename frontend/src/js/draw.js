(function(){

    var tag=lib('>tag');
    lib('ajax');
    lib('other');
   
    function rightJoin(key,arr1,arr2){
       var result=[], tmp=[],
        i=0, j=0, len2=arr2.length, len1=0;
            for(;i<len2;i++){
                tmp=[];
                len1=arr1.length;

                for(;j<len1;j++)
                {
                   if(arr2[i][key]==arr1[j]){
                       result[result.length]=arr2[i];
                    }
                    else{
                          tmp[tmp.length]=arr1[j];
                    }
                }
                arr1=tmp;
                j=0;
            }
        return result;
    }
    function joinEvents(timeline,events){
       var result=[], tmp=[],
        i=0, j=0, len2=events.length, len1=0;
            for(;i<len2;i++){
                tmp=[];
                len1=timeline.length;

                for(;j<len1;j++)
                {
                   if(typeof timeline[j]=='string' && events[i]['id']==timeline[j]){
                       result[result.length]=events[i];
                    }
                    else{
                        tmp[tmp.length]=timeline[j];
                    }
                }
                timeline=tmp;
                j=0;
            }
            
        return result;
    }
    function randomColor(){
        return '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
    }
    function textColor(bgColor){
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
            hex = bgColor.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            }),
            arrhex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex),
            r=parseInt(arrhex[1], 16),
            g=parseInt(arrhex[2], 16),
            b=parseInt(arrhex[3], 16),
            brightness=(0.2126*r + 0.7152*g + 0.0722*b);
        return (brightness<100)?'#fff':'#000';
    }
    function shortLabel(str,len) {
        var words, shrt;
        if(len>1){
            words=str.split(' ');
            shrt=(words.length>1)?words[0].charAt(0)+words[words.length-1].charAt(0):words[0].charAt(0)+words[0].charAt(words[0].length-1);
        }
        else{
            shrt=str.charAt(0);
        }
        return shrt.toUpperCase();
    }
    var 
    Point=function(x,y){
        this.x=x;
        this.y=y;
    },
    Node=function(x,y,size,marker){
        Point.call(this,x,y);
        this.size=size || 0;
        this.marker=marker;
        return this;
    },
    Marker=function(x,y,size,type,color,icon){
        Node.call(this,x,y,size);
        this.type=type;
        this.color=color;
        this.icon=icon;
        this.exts=[];
        this.ents=[];
        this.label=null;
        return this;
    },
    Label=function(text,x,y,align,font){
        Point.call(this,x,y);
        this.text=text;
        this.w05=
        this.gap=0;
        this.align=align||this.defaults.align;
        this.font=font||this.defaults.font;
        this.visible=true;
    },
    Line=function(y,color){
        this.y=y;
        this.color=color || randomColor();
        this.visible=true;
        this.nodes=[];
    },
    User=function(id,name,img,owner,line){
        //require!
        this.id=id;
        this.owner=owner;

        this.name=name;
        this.img=img;
        this.online=owner;
        this.line=line;
        return this;
    },
    Font=function(face,size,style,weight) {
        this.face=face || 'Verdana';
        this.size=size || 10;
        this.style=style || 'normal';
        this.weight=weight || 'normal';
    };
    Font.prototype.toString=function(){
        return (this.weight + " " + this.style + " " + this.size + "px " + this.face);
    };
    Marker.prototype.font=new Font("Verdana",14);
    Marker.prototype.addLink=function(type,x,y,color,dir){
        this[type+'s'].push({x:x,y:y,color:color,dir:dir});
    };
    Label.prototype.defaults={font:new Font("Verdana",12),align:'center'};
    Label.prototype.toString=function(){
        return this.text;
    };
    function Draw(element,options){
        this.options=options || {url:'/',
                                cellSize:40, 
                                scale:3, 
                                date:(new Date()).getTime(),
                                grid:true,
                                user:{id:"2"}
                            };
        this.MAXLP=3;
        this.users=[];
        this.events=[];
        this.markers=
        this.labels=null;
        this.uy=1;
        this.elem={
            container:element,
            canvas:null,
            palette:null,
            legend:null,
            captions:null
        };
        this.handlers={
            move:[],
            click:[],
            resize:[]
        }
        this.width=
        this.height=
        this.cy=0;
        this.scale=3;
        this.cellSize=40;
        this.lineWidth=8;
        this.linePadding=3;
        this.columns=0;
        this.rows=
        this.ctx=
        this.from=
        this.to=
        this.dto=null;
        this.rulerH=
        this.sceneL=
        this.ulineL=
        this.xend=
        this.tbegin=0;
        this.dashLen=5;
        this.reverse=false;
        this.init();
        return this;
    }
    Draw.supportsCanvas=function(){
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    };
    if(!Draw.supportsCanvas()){
        return;
    }
    Draw.prototype.init=function(){
        var draw=this, 
        to, from, dto, dfrom,
        container=this.elem.container, canvas,
        vp=viewport(),
         scale=this.scale;
         this.elem.captions=container.div({id:'captions'}).inside;
         canvas=this.elem.canvas=container.canvas().inside;
         this.sceneL=this.cellSize*3;
         this.rulerH=this.lineWidth*2;
        this.ulineL=this.lineWidth*3;

        this.setSize(vp.width,vp.height);
        
        this.ctx=canvas.node.getContext("2d");
        this.elem.legend = container.div({id:'legend',css:{'display':'none'}}).inside;
        
        to=this.to=new Date(this.options.date);
        dto=this.dto=Draw.time(to.getTime(),scale);
        dfrom=this.tbegin=dto-this.columns;

        Marker.prototype.R=this.lineWidth*1.5;
        Marker.prototype.PADDING=3;
        User.prototype.R=this.cellSize/2;
        User.prototype.LBINDENT=32;
        User.prototype.LBLEFT=this.ulineL+10;
        var testc=container.div({'style':'position:absolute;z-index:10;bottom:50px;right:100px;background-color:#000;color:#fff;width:200px;height:50px'})
        .in.click(function(e){
            e.stopPropagation();
            console.log(draw.handlers.resize); 
            draw.loading();});
        //container.out
        tag(window).mousemove(function(){
            var container=testc.div().in;
           return function(e){
                var mx=event.clientX,
                my=event.clientY;
                container.setText('mouse '+mx+' , '+ my);
            }
        }()).click(function(){
            draw.loading.stop();
            testc.css({'background-color':'#f0f'});
            setTimeout(function(){testc.css('background-color','#000')},100);
        }).resize(function(){
            var container=testc.div().in;
            return function(){
                draw.resizeHandler();
                container.setText('window '+draw.width+' , '+draw.height);
            }
        }());
        this.loading();
        this.loading();
        this.loading();
        this.loading();
        //dfrom=this.to=this.dateto(from,scale);
        req('/'+dfrom+'-'+dto+'-'+scale)
        .done(function(data){
            draw.adaptation(data.json());
        });
        //this.palette();
    }
    Draw.prototype.setSize=function(w,h){
        this.width=w;
        this.height=h;
        this.cy=Math.round(h/this.cellSize/2);
        this.elem.canvas.attr({width:w,height:h});
        this.rows=Math.floor(h/this.cellSize)-2;
        this.columns=Math.floor((w-this.sceneL)/this.cellSize);
    }
    Draw.prototype.resizeHandler=function(){
        var prevw=this.width,
        prevh=this.height,
        vp=viewport(),
        diffw,diffh,gap;
        diffh=Math.abs(prevh-vp.height);
        diffw=Math.abs(prevw-vp.width);
        gap=10,
        rhandls=this.handlers.resize,
        i=0,len=rhandls.length;
        
        //console.log(vp);
        if(gap<=diffh && gap<=diffw){
            this.setSize(vp.width,vp.height);
            this.setLinesY();
            this.tbegin=this.dto-this.columns;
            this.render();
            for(;i<len;i++){    
                rhandls[i](vp.width,vp.height);
            }
        }
        else if(gap<=diffh){
            this.setSize(vp.width,vp.height);
            this.setLinesY();
            this.render();
            for(;i<len;i++){
                if('dir' in rhandls[i]){
                    if(rhandls[i].dir=='v'){
                        rhandls[i](vp.width,vp.height);
                    }
                }
                else{
                    rhandls[i](vp.width,vp.height);
                }
            }
        }
        else if(gap<=diffw){
            this.setSize(vp.width,vp.height);
            this.tbegin=this.dto-this.columns;
            this.render();
            for(;i<len;i++){
                if('dir' in rhandls[i]){
                    if(rhandls[i].dir=='h'){
                        rhandls[i](vp.width);
                    }
                }
                else{
                    rhandls[i](vp.width,vp.height);
                }
            }
        }
    }
    Draw.prototype.moveHandler=function(e){
        var fns=this.handlers.move,
        len=fns.length,i=0;
        for(;i<len;i++){
            fns[i].call(this,e);
        }
    };
    Draw.time=function(msec,scale){
        var time, minutes=msec/60000;
        switch(scale){
            case 1:time=minutes;break;
            case 2:time=minutes/60;break;
            case 3:time=minutes/1440; break;
            case 4:time=minutes/43830; break;
            case 5:time=minutes/525960; break;
        }
        return Math.floor(time);
    }

    var rUserId=/^@(\d+)$/;
    
    Draw.prototype.updateUsers=function(users){
        var cur_users=this.users, tmp=[], 
        i=0, len=cur_users.length, j=0,len2=users.length;
        for(;i<len;i++){
            for(j=0; j<len2; j++){
                if(users[j].id==cur_users[i].id){
                    cur_users[i]=users[j];
                }
                else{
                    tmp[tmp.length]=users[j];
                }
            }
            users=tmp;
            len2=tmp.length;
            tmp=[];
        }
        cur_users=cur_users.concat(users);
        return cur_users;
    };
    Draw.prototype.addUser=function(user){
        var users=this.users,
        cy=this.cy,
        exstu,
        noob,
        y=this.linePadding,
        dir=1,lp05=this.linePadding/2;
        exstu=users.find(function(u){return u.id===user.id;});
         if(exstu){
            return false;
         }
         else{
            noob=new User(user.id,user.name,
                user.img,user.owner,user.line||new Line());
         }
        users.push(noob);
        return noob;
    };
    Draw.prototype.setLinesY=function(){
        var users=this.users,
        cy=this.cy,
        rows=this.rows,
        n=0,
        y=cy,
        padd=this.setLinePadd(),
        step=padd,
        sign=-1;
        users.forEach(function(u){
            if(u.owner){
                u.line.y=cy;
            }
            else{
                y=cy+step*sign;
                sign*=-1;
                step+=padd*(n%2);
                if(y>1 && y<=rows){
                    u.line.y=y;
                    u.line.visible=true;
                }
                else{
                    //not free ypos for user. user will not be displayed
                    u.line.visible=false;
                }
                n++;
            }
        });
    };
    Draw.prototype.setLinePadd=function(){
        var nrows=this.rows,
        nusers=this.users.length;
        this.linePadding=Math.min(
            Math.floor((nrows)/nusers) || 1,
            this.MAXLP);
        this.dashLen=Math.round((this.cellSize*this.linePadding)/6);
        return this.linePadding;
    }
    var loading=Draw.prototype.loading=function(){
        var maxVal=7,
        d=maxVal*2,
        minVal=1,
        dist=maxVal-minVal,
        dist2=dist*2,
        radii=[0,dist/2,dist],
        N=radii.length,
        height,
        cellSize,
        margin=7,
        x,y,
        w=(d+margin)*N,
        h=d,
        interv,
        id=0,
        animation,resize,hndlres,clear,
        ctx,
        ulineL,
        sceneL,
        lineWidth;

        resize=function(w,h){
                        height=h;
                        y=height-cellSize+maxVal;
                    };
        resize.dir='v';
        clear=function(){
                    ctx.clearRect(x-maxVal-2,y-maxVal-2,w+4,h+4);
                };

        return function(control){
            //msec 800 533 266
            var currid=id;
            id=(control || function(id){return ++id})(id);
            console.log('id',id);
            if(id>currid){
                if(id==1){
                    ctx=this.ctx;
                    ulineL=this.ulineL;
                    sceneL=this.sceneL;
                    lineWidth=this.lineWidth;
                    height=this.height;
                    cellSize=this.cellSize;
                    x=ulineL+maxVal+(((sceneL-ulineL)-w)/2);
                    y=height-cellSize+maxVal;
                    hndlres=this.handlers.resize;
                    hndlres.push(resize);
                    animation=function(){
                        var i=N,ax=x,r,ri;
                        //clear
                        clear();
                        ctx.fillStyle="#444"//"#ddd";
                        //ctx.lineWidth=1;
                        ctx.beginPath();
                        for(;i--;){
                            //console.log(ax,i);
                            ctx.beginPath();
                            ri=radii[i];
                            r=( (ri>dist)?dist-(ri%dist):ri) + minVal;
                            ctx.arc(ax,y,r,0,2*Math.PI,true);
                            ctx.fill();
                            ax+=d+margin;
                            radii[i]=(ri+1)%dist2;
                        }
                        ctx.closePath();
                    };
                    interv=setInterval(animation,90);
                }
            }else if(id==0){
                clearInterval(interv);
                interv=null;
                clear();
                var res=resize,i=0,len=hndlres.length;
                for(;i<len;i++){
                    if(hndlres[i]==res){break;}
                }
                hndlres.splice(i,1);
            }
        }
    }();
    loading.stop=function(){
        loading(function(id){return Math.max(--id,0);});
    }
    Draw.prototype.usersLine=function(){
        var ctx=this.ctx,
        users=this.users,
        lineWidth=this.lineWidth,
        linepadd=this.linePadding,
        rulerH=this.rulerH,
        cellSize=this.cellSize,
        x=this.ulineL,
        r,
        h=this.height;
        //users line
        ctx.beginPath();
        ctx.strokeStyle = "#ddd";
        ctx.lineWidth=lineWidth;
        ctx.moveTo(x,rulerH);
        ctx.lineTo(x,h-rulerH);
        ctx.stroke();
        //ctx.lineWidth=5;
        users.forEach(function(u){
            if(u.line.visible){
                var uy=u.line.y*cellSize;
                ctx.beginPath();
                ctx.fillStyle = u.line.color;
                ctx.lineWidth=lineWidth;
                //ctx.strokeStyle="#fff"
                r=(u.owner)?lineWidth:lineWidth-2;
                ctx.arc(x, uy+r-u.R, r, 0, Math.PI * 2, true);
                ctx.stroke();
                ctx.fill();
                ctx.closePath();
                if(linepadd>1){
                    ctx.beginPath();
                    ctx.lineWidth=lineWidth;
                    ctx.moveTo(x,uy+u.LBINDENT);
                    ctx.lineTo(u.LBLEFT,uy+u.LBINDENT);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        })
    };
    Draw.prototype.user=function(user){
        var ctx=this.ctx,
        draw=this,
        cellSize=this.cellSize,
        padd=Marker.prototype.PADDING,
        x=user.LBLEFT+user.R+padd,
        r=user.R,
        y=user.line.y*cellSize,
        thumbImg, label,font;
        if(this.linePadding>1){
            font=new Font("Verdana",13);
            label=new Label(user.name);
            label.w05=ctx.measureText(user.name).width/2+padd;
            label.x=user.LBLEFT+padd;
            label.y=y+user.LBINDENT;
            label.font=font;
            label.align='left';
            label.gap=cellSize-label.w05;
            this.labels.push(label);
        }
        if(user.img){
            thumbImg = new Image();
            thumbImg.src = user.img;
            thumbImg.onload = function() {
                // console.log(thumbImg)
                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();

                ctx.drawImage(thumbImg, x-r, y-r,cellSize,cellSize);
                ctx.restore();
                ctx.beginPath();
                ctx.strokeStyle="#fff";
                ctx.lineWidth=1;
                ctx.arc(x, y, r, 0, Math.PI * 2, true);

                //ctx.clip();
                ctx.closePath();
                ctx.stroke();
                draw.userStatus(user);  
            };
        }
        else{
            ctx.beginPath();
            ctx.fillStyle=user.line.color;
            ctx.arc(x, y, r, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.font="20px Verdana";
            ctx.textAlign="center";
            ctx.textBaseline="middle";
            ctx.fillStyle = textColor(user.line.color);  
            ctx.fillText(shortLabel(user.name,2),x,y);
            ctx.closePath();
            ctx.fill();
            this.userStatus(user);
        }
    };
    Draw.prototype.userStatus=function(user){
        var ctx=this.ctx,
        r=5,
        padd=Marker.prototype.PADDING;
        if(user.online){
            ctx.beginPath();
            ctx.strokeStyle="#fff";
            ctx.fillStyle="#b4c7ff";
            ctx.arc(user.LBLEFT+padd+(user.R*2)-r,user.line.y*this.cellSize+user.R-r,r,0,Math.PI*2,true);
            ctx.lineWidth=2;

            ctx.fill();
            ctx.stroke();
            ctx.closePath();
        }
    };
    Draw.prototype.adaptation=function(data){
        var draw=this,
        pos=0,
        events=data.events.slice(0);
        if(data.users){
            each(data.users,function(user){
                draw.addUser(user)
            });
            this.setLinesY();
        }
        this.events=this.events.filter(function(evnt){
            return (evnt.from>=draw.from && evnt.from<=draw.to)
        });
        this.events=this.events.concat(

            data.events.map(function(event){
                var partics,i,plen,id;
                event.from=parseInt(event.from);
                event.to=parseInt(event.to);
                if(partics=event.participants){
                    plen=partics.length;
                        for(i=0;i<plen;i++){
                            if(typeof partics[i]=='string'){
                                id=partics[i];
                                partics[i]={
                                    id:id,
                                    from:event.from,
                                    duration:event.to-event.from
                                }
                            }
                            else{
                                partics[i].from=parseInt(partics[i].from);
                            }
                        }
                }else{
                    event.participants=[];
                }
                return event;
            
            })
            );
        this.render(); 
        this.legendItems();
    };
    var legendItems=Draw.prototype.legendItems=function(){
        var draw=this,users=this.users, legend=this.elem.legend,
        palette=this.elem.palette,
        item=function(u,wrapClass){
                    var 
                    item=legend.div({'class':wrapClass}).in
                        .div({'class':'ava','style':'background-color:'+u.line.color}).in
                            .img({src:u.img})
                            .div({'class':'caption-img'})
                            .click(function(){
                                var w=this.offsetWidth,
                                elem=tag(this),
                                offset=elem.offset(),
                                top=palette.offset().top,
                                move=function(){
                                    palette.css({left:offset.left+offset.width+2,top:offset.top});
                                    legendItems.choiceColor=function(uid){
                                        return function(color){
                                            elem.css('background-color',color);
                                            draw.setUserColor(uid,color);
                                        }
                                    }(u.id);
                                };
                                if(palette.node.classList.contains('hidden') ){
                                    palette.node.classList.remove('hidden');
                                    move();
                                }
                                else if(top==offset.top){
                                    palette.node.classList.add('hidden');
                                }
                                else{
                                    move();
                                }
                            })
                            .in
                                .i({'class':'fa fa-paint-brush fa-lg'})
                            .out
                        .out
                        .p(u.name);
                    return item;
                }, i=0, len=users.length;

                for(; i<len; i++){
                    if(users[i].owner){
                        legend.first();
                        item(users[i],'owner').span('Мои альбомы');
                    }
                    else{
                        item(users[i],'');
                    }   
                }
    };
    //legendItems.elem=null;
    legendItems.choiceColor=null;
    Draw.prototype.setUserColor=function(uid,color){
        var users=this.users,
        i=0, len=users.length;
        for(; i<len;i++){
            if(uid===users[i].id){
                users[i].line.color=color;
                break;
            }
        }
        this.render();
    };
    Draw.prototype.hideLine=function(uid){
        var user=this.users.find(function(u){return uid===u.id});
        user.line.visible=false;
    };
    Draw.prototype.palette=function(){
        var colors=['#3E91DB','#8AB417','#f3f31d','#ff4db2','#FFA200','#ED1C24','#73503C'],
        elem=this.elem,
        palette=elem.palette=elem.container.div({id:'palette','class':'hidden'}).in.div({'class':'colors'}), 
        i=0, len=colors.length, button;
            for(; i<len; i++){
                palette.inside.div({'css':{'background-color':colors[i]}}).in
                .click(function(color){
                    return function(){
                        legendItems.choiceColor(color);
                    }
                }(colors[i]));
            }
    };
    Draw.prototype.eachUser=function(i){
        //this.user(this.users[i]);
        this.line(this.users[i].line);
    }
    Draw.prototype.render=function(){
        this.clear();
        this.grid();
        var lines={},
            labels=[],label,
            markers=[],
            sel,
            iM=0,iL=0,
            columns = this.columns,
            scale = this.scale,
            cellSize=this.cellSize,
            lineWidth = this.lineWidth,
            grid = this.options.grid,
            node,
            to=null,
            draw=this,
            sceneL=this.sceneL,
            users=this.users,
            events=this.events,
            elem=this.elem.container,
            i=0,len;
            len=users.length;
            each(events,function(event){
                var organizer,
                marker=event.marker || {},
                i=0, j=0,
                plen, ulen, 
                partics,
                partic, line,
                id, from,
                type, size=x=y=0,
                iM,iL,
                ent,ext;
                x=(event.from-draw.tbegin)*cellSize;
                if( x>=0 && x<=draw.dto && (organizer=users.find(function(user){return (user.id===event.organizer && user.line.visible)})) ){
                    line=organizer.line;
                    iM=markers.length;
                    iL=labels.length;
                    y=line.y*cellSize;
                    marker=markers[iM]=new Marker(
                        sceneL+x,
                        y,
                        event.to-event.from,
                        marker.type || '',
                        marker.color||line.color,
                        marker.icon || ''
                    );
                    if(event.name){
                        label=labels[iL]=new Label(event.name,marker.x,marker.y);
                        if(marker.x<=sceneL){
                            label.visible=false;
                        }
                        marker.label=iL;
                    }
                    //lines[organizer.y]=line;
                    if(partics=event.participants){
                        plen=partics.length;
                        for(;i<plen;i++){
                           /* if(typeof partics[i]=='string'){
                                id=partics[i];
                                from=event.from;
                                size=event.to-from;
                            }
                            else{*/
                                id=partics[i].id;
                                size=partics[i].duration;
                                from=partics[i].from;
                            //}
                            if(partic=users.find(function(user){return (user.id===id && user.line.visible)})){
                                x = sceneL+((from-draw.tbegin)*cellSize);
                                line=partic.line;
                                node=new Node(x,y,size,iM);
                                line.nodes[line.nodes.length]=node;
                                marker.addLink('ent',x,line.y,line.color);
                                marker.addLink('ext',x+size*cellSize,line.y,line.color);
                            }
                        }
                    }
                }
            });
            this.labels=labels;
            this.markers=markers;
            len=users.length;
            this.usersLine();
            for(i=0;i<len;i++){
                if(users[i].owner){
                    sel=i;
                }
                else{
                    this.eachUser(i);
                }
            }
            this.eachUser(sel);
            len=markers.length;
            for(i=0;i<len;i++){
             this.marker(markers[i]);   
            }
            len=labels.length;
            for(i=0;i<len;i++){
             this.label(i);   
            }            
    };
    Draw.prototype.line=function(line){
        var ctx = this.ctx,
        cellSize=this.cellSize,
        padding=cellSize*this.linePadding,
        sceneL=this.sceneL,
        rows=this.rows,
        color=line.color,
        columns=this.columns,
        markers=this.markers,
        node,
        sign=1,
        diff=0,
        yDiff,
        pxDiff,
        nxDiff,
        pyDiff,
        nyDiff,
        ly=line.y*cellSize,
        y=0,
        x=0,
        i=0,
        j=0,
        len,
        len2,
        nodes=line.nodes,
        next,
        prev,
        width=this.lineWidth,
        marker,pmarker,
        ent,ents,
        ext,exts,
        links;
       ctx.beginPath();
        if(nodes.length > 0){
            nodes.sort(function(a,b){
                return a.x-b.x;
            });
            if(nodes[0].x==sceneL){
                ctx.moveTo(sceneL, nodes[0].y);
                nodes.unshift(new Node(sceneL, nodes[0].y));
            }
            else{
                ctx.moveTo(sceneL, ly);
                nodes.unshift(new Node(sceneL, ly));
            }
            nodes.push(new Node(this.width,ly));
            //console.log(nodes);
            i=1;
            len=nodes.length-1;
            for(; i<len;i++){
                prev=nodes[i-1];
                node=nodes[i];
                next=nodes[i+1];
                pxDiff=node.x-(prev.x+prev.size*cellSize);
                nxDiff=next.x-(node.x+node.size*cellSize);
                pyDiff=Math.abs(node.y-prev.y);
                yDiff=Math.abs(node.y-ly);
                ent=ext=marker=null;
                if(node.marker){
                    marker=markers[node.marker];
                    ents=marker.ents;
                    exts=marker.exts;
                    len2=ents.length;
                    for(j=0;j<len2;j++){
                        if(ents[j].y==line.y){
                            ent=ents[j];
                            break;
                        }
                    }
                }
                if(pxDiff<cellSize){
                    sign=(prev.y-node.y)>0?1:-1;
                    if(ent){ent.dir=-1*sign;}
                    if(prev.marker){
                        pmarker=markers[prev.marker];
                        exts=pmarker.exts;
                        len2=exts.length;
                        for(j=0;j<len2;j++){
                            if(exts[j].y==line.y){
                                exts[j].dir=sign;
                                break;
                            }
                        }
                    }
                    if(prev.size>0){
                        ctx.lineTo(prev.x+(prev.size*cellSize),prev.y);
                    }
                    if(pyDiff>padding){
                        this.dashedLine(node.x,prev.y,node.x,(node.y+(sign*(padding/2))));
                        ctx.lineTo(node.x,node.y);
                    }
                    else{
                        ctx.lineTo(node.x,node.y);
                    }
                }
                else if(pxDiff==cellSize){
                    sign=(node.y-prev.y)>0?1:-1;
                    if(ent){ent.dir=sign;}
                    if(prev.marker){
                        pmarker=markers[prev.marker];
                        exts=pmarker.exts;
                        len2=exts.length;
                        for(j=0;j<len2;j++){
                            if(exts[j].y==line.y){
                                exts[j].dir=-1*sign;
                                break;
                            }
                        }
                    }
                    x=prev.x+(prev.size*cellSize);
                    y=node.y+(-1*sign*cellSize);
                    if(prev.size>0){
                        ctx.lineTo(x,prev.y);
                    }
                    if(node.y==prev.y){
                        ctx.lineTo(node.x,node.y);
                    }
                    else{
                        // if(node.size>0){
                            if(pyDiff>padding){
                                ctx.lineTo(x,prev.y+(sign*(padding/2)));
                                this.dashedLine(x,prev.y+(sign*(padding/2)),x,y);
                            }
                            else{
                                ctx.lineTo(x,y);
                            }
                        //}
                        // else{
                        //     nyDiff=(nxDiff>cellSize) ? (node.y-ly) : (node.y-next.y);
                        //     if((nyDiff*sign)>0){
                        //         ctx.moveTo(x,y);
                        //     }
                        //     else{
                        //         if(pyDiff>padding){
                        //             ctx.lineTo(x,prev.y+(sign*(padding/2)));
                        //             this.dashedLine(x,prev.y+(sign*(padding/2)),x,y);
                        //         }
                        //         else{
                        //             ctx.lineTo(x,y);
                        //         }
                        //     }
                        // }
                        ctx.quadraticCurveTo(x, node.y,node.x, node.y);
                    }
                }
                else{
                    sign=(node.y-ly)>0?1:-1;
                    if(ent){ent.dir=sign;}
                    ctx.lineTo(node.x-cellSize,ly);
                    y=ly+(sign*cellSize);
                    ctx.quadraticCurveTo(node.x, ly,node.x, y);
                    if(yDiff>padding){
                        this.dashedLine(node.x,y,node.x,(node.y+(-1*sign*(padding/2))) );
                        ctx.lineTo(node.x,node.y);
                    }
                    else{
                        ctx.lineTo(node.x,node.y);
                    }
                }
                if(nxDiff>cellSize){
                    sign=(node.y-ly)>0?1:-1;

                    if(marker){
                        exts=marker.exts;
                        len2=exts.length;
                        for(j=0;j<len2;j++){
                            if(exts[j].y==line.y){
                                exts[j].dir=sign;
                                break;
                            }
                        }
                    }
                    x=node.x+(node.size*cellSize);
                    if(node.size>0){
                        ctx.lineTo(x,node.y);
                        if(yDiff>padding){
                            y=node.y+(-1*sign*(padding/2));
                            ctx.lineTo(x,y);
                            this.dashedLine(x,y,x,ly+(sign*cellSize));
                        }
                        else{
                            ctx.lineTo(x,ly+(sign*cellSize));
                        }
                    }
                    else{
                        if( pxDiff>cellSize ){
                            ctx.moveTo(x,ly+(sign*cellSize));
                        }
                        else{
                            if(yDiff>padding){
                            y=node.y+(-1*sign*(padding/2));
                            ctx.lineTo(x,y);
                            this.dashedLine(x,y,x,ly+(sign*cellSize));
                            }
                            else{
                                ctx.lineTo(x,ly+(sign*cellSize));
                            }  
                        }
                    }
                    ctx.quadraticCurveTo(x, ly,x+cellSize,ly);
                    if(ly==next.y){
                        ctx.lineTo(next.x,next.y);
                    }

                }
            }
        }
        else if(line.visible){
            ctx.moveTo(sceneL, ly);
            ctx.lineTo(this.width,ly);
        }
        else{
            //line is invisible
            return false;
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();

        //empty nodes
        line.nodes=[];
    };
    Draw.prototype.dashedLine=function(sx, sy, ex, ey, dashLen) {
        var ctx=this.ctx;
          if (dashLen == undefined) dashLen = this.dashLen;
          ctx.moveTo(sx, sy);

          var dX = ex - sx;
          var dY = ey - sy;
          var dashes = Math.floor(Math.sqrt(dX * dX + dY * dY) / dashLen);
          var dashX = dX / dashes;
          var dashY = dY / dashes;

          var q = 0;
          while (q++ < dashes) {
            sx += dashX;
            sy += dashY;
            ctx[q % 2 == 0 ? 'moveTo' : 'lineTo'](sx, sy);
          }
          ctx[q % 2 == 0 ? 'moveTo' : 'lineTo'](sx, sy);

          return ctx;
    };

    function markerY(x,r,left,right,xpos,Iy){
        var y,
        max=7,mid=4,min=2,
        margin,next;
        if(x<left){
            next=x+max;
            margin=(next>left && next<(left+r))?mid:max;
            xpos[0]+=margin;
            xpos[1]+=margin;
            return 0;
        }
        else if(x==left || x==right){
            xpos[0]+=min;
            xpos[1]+=min;
            return 0;
        }
        else if(x>right){
            next=x-max;
            margin=(next>(right-r) && next<right)?mid:max;
            xpos[0]+=margin;
            xpos[1]+=margin;
            return 0;
        }
        //y=r*(Math.sin(Math.acos( (Math.min(x,Math.max(x-size,r)))/r )))+top;
        if(x<(left+r)){
            x=r-x+left;
        }
        else if(x>(right-r)){
            x=x-right+r;
        }
        else{
            xpos[Iy]+=max;
            return r;
        }
        xpos[Iy]+=mid;
        y=Math.round( r*(Math.sin(Math.acos( x/r ))) );
        return y;
    }
    Draw.prototype.marker=function(marker){
        var style,
            sceneL=this.sceneL, 
            el=this.elem.captions, 
            ctx=this.ctx,
            size=marker.size, 
            cellSize=this.cellSize,
            lineWidth=this.lineWidth,
            halfX,half,
            ents,ent,
            exts,ext,
            i=0,len,
            Ix,Iy,
            xpos=Array(size+1).fill(0).map(function(itm,i){var val=i*cellSize; return [val,val];}),
            x = marker.x,
            y = marker.y,
            r=marker.R,lr=0,entX,extX,lx,ly,dir,
            left,right,top,bottom,
            padding=marker.PADDING,
            yPadd,
            fx,fy,
            fgColor = "#444",
            bgColor = "#ffffff",
            label,lbldir=0,text="",shrt,shrtlen=1,
            maxw=4*cellSize;
        ctx.strokeStyle = fgColor;
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        switch(marker.type.toLowerCase())
        {
            case "color":
                lr=lineWidth*0.25;
                ctx.lineWidth = r;
                ctx.strokeStyle = "#444";
                halfX=x+((cellSize*size)/2);
                if (size == 0){
                    shrtlen=1;
                    left=x-r-padding;
                    right=x+r+padding;
                    entX=left;
                    extX=right;
                    ctx.fillStyle = bgColor;
                    ctx.arc(x, y, r, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fill();
                }
                else
                {
                    shrtlen=2;
                    half=cellSize*0.4;
                    left=halfX-half-r-padding;
                    right=halfX+half+r+padding;
                    entX=left;
                    extX=right;
                    if(size>1){
                        extX=x+(cellSize*size);
                        ctx.fillStyle = fgColor;
                        ctx.arc(extX, y, lineWidth * 0.7,   1.5* Math.PI, 0.5 * Math.PI, false);
                        ctx.arc(x, y, lineWidth * 0.7,0.5* Math.PI, 1.5 * Math.PI, false);
                        ctx.fill();
                        entX=x;

                    }
                    maxw=Math.max(maxw,cellSize*size);
                    ctx.beginPath();
                    ctx.fillStyle = bgColor;
                    ctx.arc(halfX-half, y, r, Math.PI * 1.5, Math.PI * 0.5, true);
                    ctx.arc(halfX+half, y, r, Math.PI * 0.5, Math.PI * 1.5, true);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fill();
                }
                if(ents=marker.ents){
                    len=ents.length;
                    for(i=0;i<len;i++){
                        ent=ents[i];
                        dir=ent.dir;
                        lbldir+=dir;
                        Ix=Math.floor((ent.x-x)/cellSize);
                        Iy=(dir==1)?0:1;
                            
                        lx=entX+xpos[Ix][Iy];
                        if(lx<halfX){
                            ctx.fillStyle = ent.color;
                            ctx.beginPath();
                            ly=y-(dir*markerY(lx,r+padding,left,right,xpos[Ix],Iy));
                            ctx.arc(lx,ly,lr, 0, Math.PI*2);
                            ctx.closePath();
                            ctx.fill();
                        }
                        else{
                            break;
                        }
                    }
                }
                xpos=xpos.map(function(itm,i){
                    var val=(size-i)*cellSize;
                    return [val,val];});
                if(exts=marker.exts){
                    len=exts.length;
                    ctx.lineWidth = 1;
                    for(i=0;i<len;i++){
                        ext=exts[i];
                        dir=ext.dir;
                        lbldir+=dir;
                        Ix=Math.floor((ext.x-x)/cellSize);
                        Iy=(dir==1)?0:1;

                        lx=extX-xpos[Ix][Iy];
                        if(lx>halfX){
                            ctx.strokeStyle = ext.color;
                            ctx.beginPath();
                            ly=y-(dir*markerY(lx,r+padding,left,right,xpos[Ix],Iy));
                            ctx.arc(lx,ly,lr, 0, Math.PI*2);
                            ctx.closePath();
                            ctx.stroke();
                        }
                        else{
                            break;
                        }
                    }
                }
                if(label=this.labels[marker.label]){
                    ctx.font=marker.font;
                    ctx.textAlign="center";
                    ctx.textBaseline="middle";
                    ctx.fillStyle = "#000";  
                    text=label.text;
                    shrt=shortLabel(text,shrtlen);
                    ctx.fillText(shrt,halfX,y);
                    ctx.font=label.font;
                    label.w05=(ctx.measureText(text).width/2)+padding;
                    label.gap=(maxw/2)-label.w05;
                    label.x=halfX;
                    if(lbldir==0 && label.gap>=label.w05){
                        label.x+=label.w05;
                        label.gap-=label.w05;
                    }
                    lbldir=(lbldir<0)?-1:1;
                    label.y=y+(lbldir*(r+padding+label.font.size));
                }
                break;
            case "interchange":
                ctx.lineWidth = lineWidth;
                if (size == 0){
                    ctx.arc(x, y, lineWidth * 0.5, 0, Math.PI * 2, true);
                }
                else
                {
                    ctx.arc(x+(/*width*/cellSize*size), y, lineWidth * 0.7,   200 * Math.PI/180, 160 * Math.PI/180, false);
                    ctx.arc(x, y, lineWidth * 0.7,20 * Math.PI/180, 340 * Math.PI/180, false);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
                break;
            case "merged":
                
                ctx.lineWidth = lineWidth/2;
                if (size == 0){
                    ctx.arc(x, y, lineWidth * 0.9, 0, Math.PI * 2,true);
                    ctx.fill();
                    ctx.arc(x, y, lineWidth * 0.7, 0, Math.PI * 2,false);
                }
                else
                {
                    ctx.arc(x+(cellSize*size), y, lineWidth,200 * Math.PI/180, 160 * Math.PI/180, false);
                    ctx.arc(x, y, lineWidth, 20 * Math.PI/180, 340 * Math.PI/180, false);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(x+(cellSize*size), y, lineWidth * 0.5, 0, Math.PI * 2,false);
                    ctx.stroke();
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x, y, lineWidth * 0.5, 0, Math.PI * 2,false);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
                break;
            case "single":
                ctx.lineWidth = lineWidth/2;
                ctx.arc(x, y, lineWidth/2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
                break;
        }
    };

    Draw.prototype.cropText=function(text,blkw,txtw){
        var txtlen,
        dotsw,
        currw=txtw,
        ctx=this.ctx,
        cropped=text,
        dots='...';
        dotsw=ctx.measureText(dots).width;
        currw+=dotsw;
        do{
            cropped=cropped.substr(0,Math.floor((blkw/currw)*cropped.length));
            currw=ctx.measureText(cropped).width+dotsw;
        }while(currw>blkw)
        return (cropped+dots);
    };
    Draw.prototype.label=function(index){
        var labels=this.labels,
        curr=labels[index],
        text=curr.text,
        len=labels.length,i=0,
        ctx=this.ctx,
        x,y,w05,
        shift,
        lNghb,rNghb,
        lDiff,rDiff;
        ctx.font=curr.font;
        ctx.fillStyle = "#000";  
        ctx.textAlign=curr.align;
        ctx.textBaseline="middle";
        if(!curr.visible){return false;}
        if(curr.gap<0){
            w05=curr.w05+curr.gap;
            text=this.cropText(text,(w05-Marker.prototype.PADDING)*2,curr.w05*2);
            curr.w05=w05;
            curr.gap=0;
        }
        lDiff=curr.gap;
        if('center'===curr.align){
            for(;i<len;i++){
                label=labels[i];
                if(label.y==curr.y){
                    if(label.x<curr.x){
                        if(lNghb){
                            if(lNghb.x<label.x){
                                lNghb=label;
                            }    
                        }
                        else{
                            lNghb=label;
                        }
                    }
                }
            }
            if(lNghb){
               lDiff=curr.x-curr.w05-lNghb.x-lNghb.w05;
            }
            if(lDiff<0){
                shift=(lDiff*-1);
                    if(shift<=curr.gap){
                        curr.x+=shift;
                    }
                    else{
                        return;
                    }
            }
        }
        ctx.fillText(text,curr.x,curr.y);
    }
    Draw.prototype.getXbyDate=function(time){
        var cellSize=this.options.cellSize,
            sceneL=this.sceneL,
            tbegin=this.tbegin, x;
            x=sceneL-((tbegin-time)*cellSize);
            return x;
    };
    Draw.prototype.dateto=function(from,scale){
        var w=this.width,
        cs=this.cellSize,
        date=new Date(from),
        units=Math.floor(w/cs),
        num=0;
        
        switch(scale){
/*minutes*/ case 1:
                date.setMinutes(date.getMinutes()-units);
                break;
/*hours*/   case 2:
                date.setHours(date.getHours()-units);
                break;
/*days*/    case 3:
                date.setDate(date.getDate()-units);
                console.log('units - ',units);
                console.log(date);
                break;
/*months*/  case 4:
                date.setMonth(date.getMonth()-units);
                break;
/*years*/   case 5:
                date.setFullYear(date.getFullYear()-units);
                break;
        }
        return date;
    };
    Draw.prototype.grid=function(){
        var ctx = this.ctx,
        	h=this.height,
        	w=this.width,
            scale=this.options.scale,
            to=this.to,
            x=this.sceneL,
            y=0,cellSize=this.cellSize,
            lineWidth=this.lineWidth,
            rulerH=this.rulerH,
            date=new Date(this.to),
            label=label2=null, l2,
            num=0,
        	rows=0,
            columns=this.columns,
            gridColor='#ddd';
        switch(scale){
/*minutes*/ case 1:
                num=date.getMinutes();
                label=function(){
                    date.setMinutes(num);
                    return date.getMinutes();
                };
                label2=function(){
                    return date.getHours()+':'+((num<10)?'0'+num:num);
                };
                break;
/*hours*/   case 2:
                num=date.getHours();
                label=function(){
                    date.setHours(num);
                    return date.getHours();
                };
                label2=function(){
                    var m=(date.getMonth()+1);
                    return num+' ('+date.getDate()+'.'+(m<10?'0'+m:m)+')';
                };
                break;
/*days*/    case 3:
                num=date.getDate();
                label=function(){
                    date.setDate(num);
                    return date.getDate();
                };
                label2=function(){
                    var m=(date.getMonth()+1);
                    return m<10?num+'.0'+m:num+'.'+m;
                };
                break;
/*months*/  case 4:
                num=date.getMonth()+1;
                label=function(){
                    date.setMonth(num-1);
                    return date.getMonth()+1;
                };
                label2=function(){
                    return num+"'"+(date.getFullYear()).toString().slice(-2);
                };
                break;
/*years*/   case 5:
                num=date.getFullYear();
                label=function(){return num;};
                break;
        }
        num-=columns;

        //top, bottom panels
		ctx.beginPath();
		ctx.moveTo(0, lineWidth); ctx.lineTo(w, lineWidth);
        ctx.moveTo(0, h - lineWidth); ctx.lineTo(w, h - lineWidth);
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = rulerH;
        ctx.stroke();
        
        ctx.fillStyle = "#000";
        ctx.font="10px Verdana";
        ctx.textAlign="center";
        ctx.textBaseline="middle";
        ctx.beginPath();
        // vertical ruler
        for (; y < h-rulerH; y += cellSize) {
            ctx.moveTo(x, y);
            ctx.lineTo(w, y);

            //not require!!
            //ctx.fillText(rows++, 5, y);
        }
        
        for (; x < w; x += cellSize) {
            ctx.moveTo(x, rulerH);
            ctx.lineTo(x, h-rulerH);
            num=label();
            if(num%5==0 && label2){
                l2=label2();
                ctx.fillText(l2, x, h-lineWidth);
                ctx.fillText(l2, x, lineWidth); 
            }
            else{
                ctx.fillText(num, x, h-lineWidth);
                ctx.fillText(num, x, lineWidth);
            }
            num++;
        }
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fill();

        ctx.closePath();
        return date;
    };
    Draw.prototype.emptyNodes=function(){
        var users=this.users, 
        i=0, len=users.length;
        for(;i<len;i++){
            users[i].line.nodes=[];
        }
    }
    Draw.prototype.clear=function(block){
        var sets={'scene':[this.sceneL-Marker.prototype.R-Marker.prototype.PADDING,
        0,this.width,this.height]},args; 
        args=(block) ? (sets[block]||block) : [0, 0, this.width, this.height];
        this.ctx.clearRect.apply(this.ctx,args);
        this.labels=[];
        this.markers=[];
        //this.elem.captions.empty();
    };
    lib('>ready').tag(function(tag){
       new Draw(tag().div({id:'map'}).in);
    });


})();
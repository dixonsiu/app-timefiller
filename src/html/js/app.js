/**
 * Personium
 * Copyright 2018 FUJITSU LIMITED
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 // 
const APP_URL = "https://app-timefiller-wakaba.demo.personium.io/";
const APP_BOX_NAME = 'app-timefiller-wakaba';

getEngineEndPoint = function() {
    return Common.getAppCellUrl() + "__/html/Engine/getAppAuthToken";
};

getStartOAuth2EngineEndPoint = function() {
    return Common.getAppCellUrl() + "__/html/Engine/start_oauth2";
};

/*
 * The followings should be shared among applications.
 */
function getProfileFromSession(callback) {
  Common.getProfile(Common.getCellUrl(), callback);
};

function getSkills() {
    return $.ajax({
        type: "GET",
        url: Common.getBoxUrl() + "Engine/data?filename=skills.json",
        headers: {
            'Authorization': 'Bearer ' + Common.getToken(),
            'Accept':'application/json'
        }
    });
}

function deleteSkills(aDom) {
    const keyword = $(aDom).data('skill');
    Common.showConfirmDialog("glossary:skillsMessage.confirmDelete", function() {
      $("[data-keyword='"+keyword.replace(/'/g, '\\\'')+"']").remove();
      updateSkills();
    });
}

function addSkills() {
    if (!processing) {
      processing = true;
      const addSkill = $("#pSkill").val();
      if (addSkill.length > 0) {
          if ($("[data-keyword='"+addSkill.replace(/'/g, '\\\'')+"']").length > 0) {
            $("#errorAddSkills").text(i18next.t("glossary:skillsMessage.errorDuplicate"));
            processing = false;
            return;
          }

          let aLi = $("<li>", {
            "data-keyword": addSkill,
            class: "pn-check-list check-position-r"
          });
          let aDiv = $("<div>", {
            class: "pn-list pn-list-no-arrow"
          });
          let aSpan = $("<span>").text(addSkill);
          aDiv.append(aSpan);
          aLi.append(aDiv);
          let aBtn = $("<button>", {
            class: "pn-btn icon-right",
            onclick: 'deleteSkills(this)',
            "data-skill": addSkill
          });
          let aImg = $("<img>", {
            class: "img-fluid skill-del-icon",
            src: "./img/skill_del.png"
          })
          aBtn.append(aImg);
          aLi.append(aBtn);
          $("#skill-list").append(aLi);
          updateSkills();
      } else {
          $("#errorAddSkills").text(i18next.t("glossary:skillsMessage.errorNotSkills"));
          processing = false;
      }
    } 
}

function updateSkills() {
    const currentInterests = _.map(
        $('#not-change-bg-check-list li'),
        function(item) {
            return $(item).data("keyword");
        }
    );
    if (currentInterests.length > 0) {
      $("#skill-list").show();
      $("#no-skill-list").hide();
    } else {
      $("#skill-list").hide();
      $("#no-skill-list").show();
    }
    updateMyData("skills.json", currentInterests, function() {
        $('#modal-common').modal('hide');
        $('#modal-create-keyword').modal('hide');
    })
}

function selectAttributes() {
    $.ajax({
        type: "GET",
        url: Common.getBoxUrl() + "Engine/data?filename=interests.json",
        headers: {
            'Authorization': 'Bearer ' + Common.getToken(),
            'Accept':'application/json'
        }
    }).done(function(data){
        if (!_.isEmpty(data.keywords)) {
            $('#not-change-bg-check-list li.pn-check-list').each(function(){
                if (_.contains(data.keywords, $(this).data('keyword'))) {
                    $(this).click();
                }
            });
        }
    });
}

function setAttributes() {
    const currentInterests = _.map(
        $('#not-change-bg-check-list li.checked'),
        function(item) {
            return $(item).data("keyword");
        }
    );
    updateMyData("interests.json", currentInterests, function() {
        // Registration success modal
        Common.openCommonDialog("glossary:attributesMessage.update", "glossary:attributesMessage.back", function() {
          sessionStorage.keywords = JSON.stringify(currentInterests);
          location.href = 'data_manager.html';
        });
    })
};

function updateMyData(filename, list, callback) {
    $.ajax({
        type: "POST",
        url: Common.getBoxUrl() + "Engine/data",
        headers: {
            'Accept':'application/json',
            'Authorization':'Bearer ' + Common.getToken()
        },
        data: JSON.stringify({
            filename: filename,
            contents: {
                keywords: list
            }
        })
    }).done(function(){
        if ((typeof callback !== "undefined") && $.isFunction(callback)) {
          callback();
        }
    });
}

function getSortedEvents(paramObj) {
  let urlOData = Common.getAppCellUrl() + "__/OData/EventList";
  let query = {
    "$top": 1000,
    "$orderby": "startDate asc, endDate desc"
  }
  if (paramObj.orderby) {
    query.$orderby = paramObj.orderby;
  }

  let filter = "";
  if (paramObj.startDate && paramObj.endDate) {
    filter = "startDate ge datetimeoffset'"+paramObj.startDate+"' and endDate le datetimeoffset'"+paramObj.endDate+"'";
  } else if (paramObj.startDate) {
    filter = "startDate ge datetimeoffset'"+paramObj.startDate+"'";
  } else if (paramObj.endDate) {
    filter = "endDate le datetimeoffset'"+paramObj.endDate+"'";
  }
  if (filter) {
    query.$filter = filter;
  }

  if (paramObj.top) {
    query.$top = paramObj.top;
  }
  let queryStr = $.param(query);
  let queryUrl = urlOData + "?" + queryStr;
  getAPI(queryUrl, Common.getToken()).done(function(odataObj) {
    if ((typeof paramObj.callback !== "undefined") && $.isFunction(paramObj.callback)) {
      paramObj.callback(odataObj);
    }
  }).fail(function(e) {
    console.log(e);
  })

}

getNamesapces = function() {
    return ['common', 'glossary'];
};

prevDayDate = function(momentObj, callback) {
  paramObj = {
    startDate: moment(momentObj).add(-1, "day").startOf("day"),
    endDate: moment(momentObj).add(-1, "day").endOf("day"),
    callback: callback
  };

  getSortedEvents(paramObj);
}

nextDayDate = function(momentObj, callback) {
  paramObj = {
    startDate: moment(momentObj).add(1, "day").startOf("day"),
    endDate: moment(momentObj).add(1, "day").endOf("day"),
    callback: callback
  };

  getSortedEvents(paramObj);
}

updatePlanning = function(eventId, status) {
  let tempData = {
    event_id: eventId,
    planStatus: status
  };
  $("footer").css("pointer-events", "none");
  getPlanningAPI(eventId).done(function(planningObj) {
    if (planningObj.d.results.length > 0) {
      updatePlanningAPI(tempData, planningObj.d.results[0].__id).done(function() {

      }).fail(function(e) {
        console.log(e);
      }).always(function() {
        $("footer").css("pointer-events", "auto");
      });
    } else {
      updatePlanningAPI(tempData).done(function() {

      }).fail(function(e) {
        console.log(e);
      }).always(function() {
        $("footer").css("pointer-events", "auto");
      });
    }
  }).fail(function(e) {
    console.log(e);
    $("footer").css("pointer-events", "auto");
  })
}

deletePlanning = function(eventId) {
  $("footer").css("pointer-events", "none");
  getPlanningAPI(eventId).done(function(planningObj) {
    if (planningObj.d.results.length > 0) {
      deletePlanningAPI(planningObj.d.results[0].__id).done(function() {

      }).fail(function(e) {
        console.log(e);
      }).always(function() {
        $("footer").css("pointer-events", "auto");
      });
    } else {
      $("footer").css("pointer-events", "auto"); 
    }
  }).fail(function() {
    $("footer").css("pointer-events", "auto");
  });
}

$(function () {

  Drawer_Menu();
  Control_Slide_List();
  Sort_Menu();
  Control_Dialog();
  Add_Check_Mark();
  Resize_Textarea();

  /**
   * Drawer_Menu
   * param:none
   */
  function Drawer_Menu() {
    $('#drawer_btn').on('click', function () {
      $('#menu-background').show();
      $('#drawer_menu').animate({
        width: 'show'
      }, 300);
      return false;
    });

    $('#menu-background').click(function () {
      $('#drawer_menu').animate({
        width: 'hide'
      }, 300, function () {
        $('#menu-background').hide();
        return false;
      });
    });

    $('#drawer_menu').click(function (event) {
      event.stopPropagation();
    });
  }

  /**
   * Sort_Menu
   * param:none
   */
  function Sort_Menu() {
    $('#sort_btn').on('click', function () {
      $('#sort-background').show();
      $('#sort-menu').animate({
        height: 'show'
      }, 300);
      return false;
    });

    $('#sort-background').click(function () {
      $('#sort-menu').animate({
        height: 'hide'
      }, 300, function () {
        $('#sort-background').hide();
        return false;
      });
    });

    $('#sort-menu').click(function (event) {
      event.stopPropagation();
    });

    // $('.pn-check-list').click(function (event) {
    //   Add_Check_Mark($('#sort-menu'), $(this));
    // });
  }

  /**
   * Control_Slide_List
   * param: none
   */
  function Control_Slide_List() {
    var visible_area = $('.slide-list>li');
    var wide_line = $('.slide-list-line');
    var line_contents = $('.slide-list-line-contents');
    var a_tag = $('.slide-list-line-contents>a');
    var edit_btn = $('.slide-list-edit-btn');

    /*Edit Button Clicked(Page's Header)*/
    edit_btn.on('click', function () {
      if (!($(this).hasClass('editing'))) {
        if (($(this).hasClass('edited'))) {
          $(this).removeClass('edited');
        }
        a_tag.addClass('disabled');
        $(this).addClass('editing');
        visible_area.filter(":last").css('display', 'none');
        line_contents.addClass('edit-ic');
        wide_line.animate({
          'left': '0px'
        }, 500);
      } else if (($(this).hasClass('editing')) && !($(this).hasClass('edited'))) {
        $(this).removeClass('editing');
        $(this).addClass('edited');
        wide_line.animate({
          'left': '-70px'
        }, 500);
        visible_area.filter(":last").css('display', 'block');
        line_contents.removeClass('edit-ic');
        line_contents.removeClass('clear-ic');
        a_tag.removeClass('disabled');
      }
    })

    /*Circle Delete Button Clicked(Page's List Left)*/
    $('.delete-check-btn').on('click', function () {
      $(this).parent().animate({
        'left': '-170px'
      }, 500);
      $(this).next().addClass('clear-ic');
    })

    /*Square Delete Button Clicked(Page's List Right)*/
    $('.line-delete-btn').on('click', function () {
      $(this).closest('li').animate({
        width: 'hide',
        height: 'hide',
        opacity: 'hide'
      }, 'slow', function () {
        $(this).remove();
      });
    });

    /*Deletion When clicking an element being checked*/
    line_contents.on("click", function () {
      if ($(this).hasClass('clear-ic')) {
        if (edit_btn.hasClass('editing')) {
          wide_line.animate({
            'left': '0px'
          }, 500);
          $(this).removeClass('clear-ic');
          a_tag.removeClass('disabled');
        }
      }
    });
  }

  /**
   * Control_Dialog
   * param:none
   */
  function Control_Dialog() {
    //clicked logout button
    $('#logout').on('click', function () {
      $('.double-btn-modal').modal('show');
    });

    //single button modal
    $('.pn-single-modal').on('click', function () {
      $('.single-btn-modal').modal('show');
    });

    //three button modal
    $('.pn-three-modal').on('click', function () {
      $('.three-btn-modal').modal('show');
    });
  }

  /**
   * Add_Check_Mark
   * param:none
   */
  function Add_Check_Mark() {
    $('.pn-check-list').click(function (event) {

      //CASE: sort list
      if ($(this).parents('#sort-menu').length != 0) {
        $('#sort-menu').find('.check-mark-right').removeClass('check-mark-right');
        $(this).addClass('check-mark-right');
      }

      //CASE: icon list
      if ($(this).parents('#icon-check-list').length != 0) {
        $(this).find('.pn-icon-check').toggle();
        if (!($(this).find('.pn-icon-check').css('display') == 'none')) {
          $(this).css('background-color', '#EEEEEE');
        } else {
          $(this).css('background-color', '#FFFFFF');
        }
      }

      //CASE: check list
      if ($(this).parents('#check-list').length != 0) {
        if ($(this).hasClass('checked')) {
          $(this).removeClass('checked');
          $(this).css('background-color', '#FFFFFF');
        } else {
          $(this).addClass('checked');
          $(this).css('background-color', '#EEEEEE');
        }
      }

      //CASE: check list
      if ($(this).parents('#not-change-bg-check-list').length != 0) {
        if ($(this).hasClass('checked')) {
          $(this).removeClass('checked');
        } else {
          $(this).addClass('checked');
        }
      }

    });

  }

  /**
   * Add_Check_Mark
   * param:none
   */
  function Resize_Textarea() {
    $(".pn-textarea").on("input", function (evt) {
      $(evt.target).height("10px");
      $(evt.target).css("lineHeight", "30px"); //init

      var p_top = Number($(this).css('padding-top').replace('px', ''));
      var p_bottom = Number($(this).css('padding-bottom').replace('px', ''));

      var wScrollHeight = parseInt(evt.target.scrollHeight - (p_top + p_bottom));
      var wLineH = evt.target.lineHeight;

      if (wScrollHeight < (wLineH * 2)) {
        wScrollHeight = (wLineH * 1);
      }

      $(evt.target).height(wScrollHeight + "px");
    });
  }
});

/**
 * View map in OpenLayers
 */
function initOpenLayer(mapId, lon, lat) {
  // Initialize
  $("#" + mapId).empty();

  // Display OpenStreetMap using OpenLayers map object
  var map = new ol.Map({
      layers: [
          new ol.layer.Tile({
              source: new ol.source.OSM() // Specify OpenStreetMap
          })
      ],
      target: mapId, // Specify the element to draw the map
      controls: ol.control.defaults({
          attributionOptions: {
              collapsible: false
          }
      }),
      view: new ol.View({
          center: ol.proj.fromLonLat([lon, lat]),
          zoom: 17
      })
  });

  // Draw destination marker on map
  var imgElement = document.createElement('img');
  imgElement.setAttribute("src", Common.getAppCellUrl() + "__/html/img/map-pin.png");
  var marker = new ol.Overlay({
    element: imgElement,
    position: ol.proj.fromLonLat([lon, lat]),
    positioning: 'bottom-center'
  });
  map.addOverlay(marker);
}

function getAPI(url, token) {
  return $.ajax({
    type: "GET",
    url: url,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept':'application/json'
    }
  });
}

function getEventAPI(id) {
  return $.ajax({
    type: "POST",
    url: Common.getAppCellUrl() + "__/html/Engine/getEvent",
    headers: {
      'Accept':'application/json',
      'Authorization':'Bearer ' + Common.getToken()
    },
    data: {id: id}
  });
}

/*
 * GET
 */
function getPlanningAPI(event_id) {
    let filter = "";
    if (event_id) {
      filter = "?$filter=event_id%20eq%20'"+event_id+"'";
    }

    return $.ajax({
        type: "GET",
        url: Common.getBoxUrl() + 'OData/planningList' + filter,
        headers: {
            'Accept':'application/json',
            'Authorization':'Bearer ' + Common.getToken()
        }
    });
};

function getMyDataAPI(filename) {
  const querystring = {'filename': filename};
  return $.ajax({
    type: "GET",
    url: Common.getBoxUrl() + "Engine/data?" + $.param(querystring),
    headers: {
      'Accept':'application/json',
      'Authorization':'Bearer ' + Common.getToken()
    }
  });
}

// Create recommended list using keywords
function createRecommendedList(orgPlanList, keywords, maxSize) {
  console.log('===originalList===');
  console.log(orgPlanList);
  const contentFiltered = filterByContent(orgPlanList);
  console.log('===contentFiltered===');
  console.log(contentFiltered);
  const keywordFiltered = filterByKeywords(contentFiltered, keywords);
  console.log('===keywordFiltered===');
  console.log(keywordFiltered);
  console.log('===========================');
  let ret = _.sample(keywordFiltered, maxSize);
  if (ret.length <= maxSize) {
    const ext = _.sample(contentFiltered, maxSize - ret.length);
    ret = _.union(ret, ext);
  }
  return ret;
}

// Filter planlist by title, image and description
function filterByContent(orgPlanList) {
  return _.filter(orgPlanList, function(event) {
    return (!_.isEmpty(event.title) && !_.isEmpty(event.image));
  });
}

// Filter planlist by keywords
function filterByKeywords(planList, keywords) {
  return _.filter(planList, function(event) {
    if (!_.isEmpty(keywords)) {
      return _.some(keywords, function(keyword) {
        return _.some(event.keywords, function(eventKeyword) {
          return (eventKeyword.indexOf(keyword) != -1);
        })
      });
    } else {
      return false;
    }
  });
}

/*
 * POST or PUT
 */
function updatePlanningAPI(tempData, id) {
    let method = "POST";
    let __id = "";
    if (id) {
      method = "PUT";
      __id = "('"+id+"')";
    }

    return $.ajax({
        type: method,
        url: Common.getBoxUrl() + 'OData/planningList' + __id,
        data: JSON.stringify(tempData),
        headers: {
            'Accept':'application/json',
            'Authorization':'Bearer ' + Common.getToken()
        }
    });
};

/*
 * DELETE
 */
function deletePlanningAPI(id) {
    return $.ajax({
        type: "DELETE",
        url: Common.getBoxUrl() + 'OData/planningList(\''+id+'\')',
        headers: {
            'Accept':'application/json',
            'Authorization':'Bearer ' + Common.getToken()
        }
    });
};
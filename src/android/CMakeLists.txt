add_library(realm-js-android SHARED
    # $<TARGET_OBJECTS:realm-js-shared>
    hack.cpp
    platform.cpp
    jni_utils.cpp
    io_realm_react_RealmReactModule.cpp
)

set_target_properties(realm-js-android PROPERTIES 
    OUTPUT_NAME "realm"
    PREFIX "lib" 
    SUFFIX ".so"
)

set_target_properties(realm-js-android
                      PROPERTIES
                      LIBRARY_OUTPUT_DIRECTORY "libs/${ANDROID_ABI}")

target_compile_definitions(realm-js-android PRIVATE
    REALM_HAVE_UV=0
    REALM_ANDROID=1
    REALM_HAVE_CONFIG=1
)

# JSC_ROOT_DIR allows sharing the same directory for all architectures and skip re-downloading
if(NOT JSC_ROOT_DIR)
    # set JSC_ROOT_DIR to current dir
    set(JSC_ROOT_DIR "${CMAKE_CURRENT_BINARY_DIR}")
endif()

set(JSC_LIB_DIR "${JSC_ROOT_DIR}/package/android/com/facebook/react/react-native/0.64.2/jni/${ANDROID_ABI}")
set (JSC_LIB_FILE "${JSC_LIB_DIR}/libreactnativejni.so")

if(NOT EXISTS ${JSC_LIB_FILE})
    set(JSC_LIB_URL "https://registry.npmjs.org/react-native/-/react-native-0.64.2.tgz")

    message(STATUS "Getting ${JSC_LIB_URL}...")
    file(DOWNLOAD "${JSC_LIB_URL}" "${JSC_ROOT_DIR}/react-native-0.64.2.tgz" STATUS download_status)

    list(GET download_status 0 status_code)
    if (NOT "${status_code}" STREQUAL "0")
        message(FATAL_ERROR "Downloading ${url}... Failed. Status: ${download_status}")
    endif()
    
    message(STATUS "Uncompressing ${JSC_ROOT_DIR}/react-native-0.64.2.tgz")
    execute_process(
        COMMAND ${CMAKE_COMMAND} -E tar xfz "react-native-0.64.2.tgz"
        WORKING_DIRECTORY "${JSC_ROOT_DIR}"
    )

    message(STATUS "Uncompressing ${JSC_ROOT_DIR}/package/android/com/facebook/react/react-native/0.64.2/react-native-0.64.2.aar")
    execute_process(
        COMMAND ${CMAKE_COMMAND} -E tar xfz "react-native-0.64.2.aar"
        WORKING_DIRECTORY "${JSC_ROOT_DIR}/package/android/com/facebook/react/react-native/0.64.2/"
    )
endif()

if (ANDROID_ABI MATCHES "^armeabi")
    target_compile_definitions(realm-js-android PUBLIC REALM_WRAP_MEMMOVE=1)
    target_link_options(realm-js-android PUBLIC -Wl,--wrap=memmove -Wl,--wrap=memcpy)
else()
    target_compile_definitions(realm-js-android PUBLIC REALM_WRAP_MEMMOVE=0)
endif()

#target_link_options(realm-js-android PUBLIC  -fvisibility=hidden)

if(REALM_JS_BUILD_CORE_FROM_SOURCE AND TARGET ObjectStore)
    target_compile_definitions(ObjectStore PUBLIC
        REALM_PLATFORM=Android
        REALM_ANDROID=1
    )
endif()

# target_include_directories(realm-js-hermes PUBLIC "../hermes")
# target_include_directories(realm-js-android PUBLIC ${CMAKE_CURRENT_SOURCE_DIR} "../hermes")
set(JSI_INCLUDES_DIR "${JSC_ROOT_DIR}/package/ReactCommon/jsi")
target_include_directories(realm-js-hermes PUBLIC ${JSI_INCLUDES_DIR})
target_include_directories(realm-js-android PUBLIC ${CMAKE_CURRENT_SOURCE_DIR} ${JSI_INCLUDES_DIR})

file (GLOB LIBRN_DIR "${JSC_LIB_DIR}")
find_library(
        REACT_NATIVE_JNI_LIB
        reactnativejni
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)
find_library(
        FBJNI_LIB
        fbjni
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)
target_link_libraries(realm-js-android ${FBJNI_LIB} ${REACT_NATIVE_JNI_LIB})
target_link_options(realm-js-android PRIVATE -Wl,--exclude-libs,libgcc.a )# -fuse-ld=lld)

#target_link_directories(realm-js-android PUBLIC "${JSC_LIB_DIR}")

target_link_libraries(realm-js-android realm-js-hermes realm-js-shared android)

if (CMAKE_BUILD_TYPE STREQUAL "Release" OR CMAKE_BUILD_TYPE STREQUAL "MinSizeRel")
    add_custom_command(TARGET realm-js-android
        POST_BUILD
        COMMAND ${CMAKE_STRIP} $<TARGET_FILE:realm-js-android>)
endif()
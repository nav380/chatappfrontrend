import DjangoConfig from '@/config/config';
import React from 'react';

const Showpic = ({ user }) => {


    return (
        <>

            {
                user.group_name ? (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                        {user.group_image ? (
                            <img src={`${DjangoConfig.profile_picture_url}${user.group_image}`} alt={user.group_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            user.group_name.charAt(0).toUpperCase()
                        )}
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                        {user.profile_picture ? (
                            <img src={`${DjangoConfig.profile_picture_url}${user.profile_picture}`} alt={user.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            user.username.charAt(0).toUpperCase()
                        )}
                    </div>
                )
            }
        </>


    );
}

export default Showpic;
